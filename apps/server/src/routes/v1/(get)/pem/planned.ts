import { operators, regions } from "@openbts/drizzle";
import db from "@openbts/drizzle/db";
import { inArray } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import type { FastifyRequest } from "fastify";
import z from "zod";

import redis from "../../../../database/redis.ts";
import { ErrorResponse } from "../../../../errors.ts";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.ts";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.ts";

export const MNC_TO_ENTITY: Record<number, string> = {
  26001: "Towerlink Poland Sp. z o.o.",
  26002: "T-Mobile Polska S.A.",
  26003: "Orange Polska S.A.",
  26006: "P4 Sp. z o.o.",
};
export const ENTITY_TO_MNC: Record<string, number> = {
  "Towerlink Poland Sp. z o.o.": 26001,
  "T-Mobile Polska S.A.": 26002,
  "Orange Polska S.A.": 26003,
  "P4 Sp. z o.o.": 26006,
};

const operatorSchema = createSelectSchema(operators);
const regionSchema = createSelectSchema(regions);

const PEMItemSchema = z.object({
  id: z.number().nullable(),
  station_id: z.string().nullable(),
  operator: operatorSchema.nullable(),
  lab: z.object({ PCA: z.string(), name: z.string() }),
  location: z.object({
    longitude: z.number(),
    latitude: z.number(),
    city: z.string(),
    address: z.string(),
  }),
  region: regionSchema.nullable(),
  date: z.object({
    from: z.iso.datetime({ offset: true }),
    to: z.iso.datetime({ offset: true }),
  }),
  status: z.enum(["PLANNED", "COMPLETED", "CANCELED"]),
});
type PEMItem = z.infer<typeof PEMItemSchema>;

const schemaRoute = {
  querystring: z.object({
    bounds: z
      .string()
      .regex(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/)
      .transform((val) => val.split(",").map(Number) as [number, number, number, number])
      .optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(25),
    status: z.enum(["PLANNED", "COMPLETED", "CANCELED"]).default("PLANNED"),
    operators: z
      .string()
      .transform((val) =>
        val
          .split(",")
          .map(Number)
          .filter((n) => Number.isFinite(n) && n > 0),
      )
      .optional(),
    station_id: z.string().optional(),
    operator: z
      .string()
      .refine((v) => v in ENTITY_TO_MNC)
      .optional(),
  }),
  response: {
    200: z.object({
      totalCount: z.number(),
      data: z.array(PEMItemSchema),
    }),
  },
};

type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };
type ResBody = z.infer<(typeof schemaRoute.response)["200"]>;

const SI2PEM_WFS_URL = "https://si2pem.gov.pl/geoserver/public/wfs";
const MAP_CACHE_TTL = 3600;

type WmsProperties = {
  bs_identity_name: string;
  bs_name: string;
  city: string;
  location_in_city: string;
  date_from: string;
  date_to: string;
  installation_operator_name: string;
  laboratory_name: string;
  laboratory_pca: string;
};
type WmsFeature = {
  type: "Feature";
  id: string;
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: WmsProperties;
};
type WmsFeatureCollection = {
  type: "FeatureCollection";
  features: WmsFeature[];
};
type ParsedWmsFeature = Omit<PEMItem, "id" | "region" | "operator"> & { operatorName: string };

function buildWfsParams(bbox: string): URLSearchParams {
  return new URLSearchParams({
    REQUEST: "GetFeature",
    SERVICE: "WFS",
    VERSION: "2.0.0",
    TYPENAMES: "public:planned_measures",
    FORMAT: "image/png",
    BBOX: `${bbox},EPSG:4326`,
    outputFormat: "application/json",
  });
}

function parseWfsFeatures(features: WmsFeature[]): ParsedWmsFeature[] {
  const seen = new Set<string>();
  return features.reduce<ParsedWmsFeature[]>((acc, feature) => {
    const {
      bs_identity_name: station_id,
      city,
      location_in_city: address,
      date_from,
      date_to,
      installation_operator_name,
      laboratory_name,
      laboratory_pca,
    } = feature.properties;
    const [lng, lat] = feature.geometry.coordinates;
    if (!station_id || seen.has(station_id)) return acc;
    seen.add(station_id);
    acc.push({
      station_id,
      date: {
        from: new Date(`${date_from} 02:00:00 UTC+2`).toISOString(),
        to: new Date(`${date_to} 02:00:00 UTC+2`).toISOString(),
      },
      lab: { PCA: laboratory_pca, name: laboratory_name },
      location: { latitude: lat, longitude: lng, city, address },
      operatorName: installation_operator_name,
      status: "PLANNED",
    });
    return acc;
  }, []);
}

async function handleBoundsMode(bbox: string, mncs: number[] | undefined): Promise<ResBody> {
  const wfsRes = await fetch(`${SI2PEM_WFS_URL}?${buildWfsParams(bbox).toString()}`, {
    headers: { Accept: "application/json", Origin: "https://si2pem.gov.pl" },
  });
  if (!wfsRes.ok) throw new ErrorResponse("NOT_FOUND");

  const json = (await wfsRes.json()) as WmsFeatureCollection;
  if (!json.features?.length) throw new ErrorResponse("NOT_FOUND");

  const parsed = parseWfsFeatures(json.features);
  if (!parsed.length) throw new ErrorResponse("NOT_FOUND");

  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent = parsed.filter((f) => new Date(f.date.to) >= oneMonthAgo);
  const filtered = mncs?.length ? recent.filter((f) => mncs.includes(ENTITY_TO_MNC[f.operatorName] ?? 0)) : recent;

  const uniqueMncs = [...new Set(filtered.map((f) => ENTITY_TO_MNC[f.operatorName]).filter(Boolean))] as number[];
  const dbOperators = uniqueMncs.length ? await db.select().from(operators).where(inArray(operators.mnc, uniqueMncs)) : [];
  const operatorsMap = new Map(dbOperators.map((op) => [op.mnc, op]));

  const data: PEMItem[] = filtered.map(({ operatorName, ...f }) => ({
    ...f,
    id: null,
    region: null,
    operator: operatorsMap.get(ENTITY_TO_MNC[operatorName] ?? 0) ?? null,
  }));

  return { totalCount: data.length, data };
}

const PLANNED_MEASUREMENTS_URL = "https://si2pem.gov.pl/api/planned_measurements";
const PLANNED_CACHE_TTL = 3600;
const PUBLISHED_CACHE_TTL = 86400;
const DATE_REGEX = /^(\d{2})\.(\d{2})\.(\d{4})$/;

type Lab = { PCA: string; name: string };
type BaseStation = {
  id: number;
  identity_name: string | null;
  name: string;
  city: string;
  address: string;
  county: string;
  voivodeship: string;
  operator: string;
  longitude: string;
  latitude: string;
  teryt: number;
};
type PlannedMeasurementResult = {
  id: number;
  base_station: BaseStation;
  date_from: string;
  date_to: string;
  lab: Lab;
  created_at: string;
  modified_at: string;
  status: "PLANNED" | "COMPLETED" | "CANCELED";
  report: string | null;
};
type PlannedResponse = { count: number; next: string; previous: string | null; results: PlannedMeasurementResult[] };

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function parseDate(date: string): [string, string, string] {
  const [, d, m, y] = date.match(DATE_REGEX) as [string, string, string, string];
  return [d, m, y];
}

async function handlePaginationMode(
  page: number,
  limit: number,
  status: string,
  mncs: number[] | undefined,
  baseStation: string | undefined,
  operatorName: string | undefined,
): Promise<ResBody> {
  const entityName = operatorName ?? (mncs?.length === 1 ? (MNC_TO_ENTITY[mncs[0]!] ?? "") : "");

  const params = new URLSearchParams({ page: String(page), page_size: String(limit), operator: entityName, status });
  if (baseStation) params.set("base_station", baseStation);
  const upstream = await fetch(`${PLANNED_MEASUREMENTS_URL}/?${params.toString()}`, {
    headers: { Origin: "https://si2pem.gov.pl", Accept: "application/json" },
  });
  if (!upstream.ok) throw new ErrorResponse("INTERNAL_SERVER_ERROR");

  const json = (await upstream.json()) as PlannedResponse;

  const results =
    mncs && mncs.length > 1 ? json.results.filter((r) => mncs.includes(ENTITY_TO_MNC[r.base_station.operator ?? ""] ?? 0)) : json.results;

  const uniqueMncs = [...new Set(results.map((r) => ENTITY_TO_MNC[r.base_station.operator ?? ""]).filter(Boolean))] as number[];
  const uniqueRegions = [...new Set(results.map((r) => capitalize(r.base_station.voivodeship)).filter(Boolean))] as string[];

  const [dbOperators, dbRegions] = await Promise.all([
    uniqueMncs.length ? db.select().from(operators).where(inArray(operators.mnc, uniqueMncs)) : Promise.resolve([]),
    uniqueRegions.length ? db.select().from(regions).where(inArray(regions.name, uniqueRegions)) : Promise.resolve([]),
  ]);

  const operatorsMap = new Map(dbOperators.map((op) => [op.mnc, op]));
  const regionsMap = new Map(dbRegions.map((r) => [r.name, r]));

  const data: PEMItem[] = results.map((result) => {
    const mnc = ENTITY_TO_MNC[result.base_station.operator];
    const [d1, m1, y1] = parseDate(result.date_from);
    const [d2, m2, y2] = parseDate(result.date_to);
    const region = capitalize(result.base_station.voivodeship);

    return {
      id: result.id,
      station_id: result.base_station.identity_name ?? null,
      location: {
        longitude: Number(result.base_station.longitude),
        latitude: Number(result.base_station.latitude),
        city: result.base_station.city,
        address: result.base_station.address,
      },
      region: regionsMap.get(region) ?? null,
      operator: operatorsMap.get(mnc ?? 0) ?? null,
      lab: result.lab,
      date: {
        from: new Date(`${m1}.${d1}.${y1} 02:00:00 UTC+2`).toISOString(),
        to: new Date(`${m2}.${d2}.${y2} 02:00:00 UTC+2`).toISOString(),
      },
      status: result.status,
    };
  });

  return { totalCount: json.count, data };
}

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResBody>>) {
  const { bounds, page, limit, status, operators: mncs, station_id, operator } = req.query;

  if (bounds) {
    const [west, south, east, north] = bounds;
    const bbox = `${west},${south},${east},${north}`;
    const cacheKey = `pem:map:${bbox}:${mncs?.join(",") ?? ""}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.send(JSON.parse(cached));

    const body = await handleBoundsMode(bbox, mncs);
    await redis.setEx(cacheKey, MAP_CACHE_TTL, JSON.stringify(body));
    return res.send(body);
  }

  const cacheKey = `pem:planned:${status}:${page}:${limit}:${mncs?.join(",") ?? ""}:${station_id ?? ""}:${operator ?? ""}`;
  const cached = await redis.get(cacheKey);
  if (cached) return res.send(JSON.parse(cached));

  const body = await handlePaginationMode(page, limit, status, mncs, station_id, operator);
  await redis.setEx(cacheKey, status === "PLANNED" ? PLANNED_CACHE_TTL : PUBLISHED_CACHE_TTL, JSON.stringify(body));
  return res.send(body);
}

const plannedMeasurements: Route<ReqQuery, ResBody> = {
  method: "GET",
  url: "/pem/planned",
  config: { allowGuestAccess: true },
  schema: schemaRoute,
  handler,
};

export default plannedMeasurements;
