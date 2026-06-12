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

enum PlannedMeasurementStatus {
  PLANNED = "PLANNED",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
}
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
type PlannedMeasurement = {
  id: number;
  base_station: BaseStation;
  date_from: string;
  date_to: string;
  lab: Lab;
  created_at: string;
  modified_at: string;
  status: PlannedMeasurementStatus;
  report: string | null;
};
type PlannedResponse = { count: number; next: string; previous: string | null; results: PlannedMeasurement[] };
const operatorSchema = createSelectSchema(operators);
const regionSchema = createSelectSchema(regions);

const schemaRoute = {
  querystring: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(25),
    status: z.enum(["PLANNED", "COMPLETED", "CANCELED"]).default("PLANNED"),
    plmn: z.coerce.number().optional(),
  }),
  response: {
    200: z.object({
      totalCount: z.number(),
      data: z.array(
        z.object({
          id: z.number(),
          station_id: z.string().nullable(),
          location: z.object({
            longitude: z.number(),
            latitude: z.number(),
            city: z.string(),
            address: z.string(),
          }),
          region: regionSchema.nullable(),
          operator: operatorSchema.nullable(),
          lab: z.object({
            PCA: z.string(),
            name: z.string(),
          }),
          date: z.object({
            from: z.iso.datetime({ offset: true }),
            to: z.iso.datetime({ offset: true }),
          }),
          status: z.enum(["PLANNED", "COMPLETED", "CANCELED"]),
        }),
      ),
    }),
  },
};
type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };
type ResBody = z.infer<(typeof schemaRoute.response)["200"]>;

const PLANNED_MEASUREMENTS_URL = "https://si2pem.gov.pl/api/planned_measurements";
const CACHE_TTL_PLANNED = 3600; // 1h
const CACHE_TTL_PUBLISHED = 86400; // 24h
const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResBody>>) {
  const { page, limit, status, plmn } = req.query;
  const entityName = MNC_TO_ENTITY[plmn ?? 0] ?? "";

  const cacheKey = `pem:planned:${status}:${page}:${limit}:${plmn}`;
  const cached = await redis.get(cacheKey);
  if (cached) return res.send(JSON.parse(cached));

  const params = new URLSearchParams({
    page: String(page),
    page_size: String(limit),
    operator: entityName ?? "",
    status,
  });

  const resBody = await fetch(`${PLANNED_MEASUREMENTS_URL}/?${params.toString()}`, {
    headers: { Origin: "https://si2pem.gov.pl", Accept: "application/json" },
  });

  if (!resBody.ok) throw new ErrorResponse("INTERNAL_SERVER_ERROR");
  const json = (await resBody.json()) as PlannedResponse;

  const uniqueOperatorPlmns = [...new Set(json.results.map((result) => ENTITY_TO_MNC[result.base_station.operator ?? ""]))].filter(
    Boolean,
  ) as number[];
  const uniqueRegions = [
    ...new Set(json.results.map((result) => result.base_station.voivodeship.charAt(0).toUpperCase() + result.base_station.voivodeship.slice(1))),
  ].filter(Boolean) as string[];

  const [dbOperators, dbRegions] = await Promise.all([
    uniqueOperatorPlmns.length ? db.select().from(operators).where(inArray(operators.mnc, uniqueOperatorPlmns)) : Promise.resolve([]),
    uniqueRegions.length ? db.select().from(regions).where(inArray(regions.name, uniqueRegions)) : Promise.resolve([]),
  ]);

  const operatorsMap = new Map(dbOperators.map((op) => [op.mnc, op]));
  const regionsMap = new Map(dbRegions.map((r) => [r.name, r]));

  const data = json.results.map((result) => {
    const entityPlmn = ENTITY_TO_MNC[result.base_station.operator];
    const dbOperator = operatorsMap.get(entityPlmn ?? 0) ?? null;
    const capitalizedRegion = result.base_station.voivodeship.charAt(0).toUpperCase() + result.base_station.voivodeship.slice(1);
    const dbRegion = regionsMap.get(capitalizedRegion ?? "") ?? null;

    // dates
    const dateFrom = result.date_from.match(dateRegex);
    const dateTo = result.date_to.match(dateRegex);
    const [, d1, m1, yyyy1] = dateFrom as [string, string, string, string];
    const [, d2, m2, yyyy2] = dateTo as [string, string, string, string];

    return {
      id: result.id,
      station_id: result.base_station.identity_name ?? null,
      location: {
        longitude: Number(result.base_station.longitude),
        latitude: Number(result.base_station.latitude),
        city: result.base_station.city,
        address: result.base_station.address,
      },
      region: dbRegion,
      operator: dbOperator,
      lab: result.lab,
      date: {
        from: new Date(`${m1}.${d1}.${yyyy1} 02:00:00 UTC+2`).toISOString(),
        to: new Date(`${m2}.${d2}.${yyyy2} 02:00:00 UTC+2`).toISOString(),
      },
      status: result.status,
    };
  });

  const body = { totalCount: json.count, data };

  const ttl = status === "PLANNED" ? CACHE_TTL_PLANNED : CACHE_TTL_PUBLISHED;
  await redis.setEx(cacheKey, ttl, JSON.stringify(body));

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
