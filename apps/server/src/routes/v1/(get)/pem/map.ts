import { operators } from "@openbts/drizzle";
import { createSelectSchema } from "drizzle-orm/zod";
import type { FastifyRequest } from "fastify";
import z from "zod";

import redis from "../../../../database/redis.ts";
import { ErrorResponse } from "../../../../errors.ts";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.ts";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.ts";

const WMS_URL = "https://si2pem.gov.pl/geoserver/public/wfs";
const CACHE_TTL = 3600;
const operatorSchema = createSelectSchema(operators);

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

const MeasurementResponse = z.object({
  station_id: z.string(),
  operator: z.string(),
  lab: z.object({
    PCA: z.string(),
    name: z.string(),
  }),
  location: z.object({
    longitude: z.number(),
    latitude: z.number(),
    city: z.string(),
    address: z.string(),
  }),
  date: z.object({
    from: z.iso.datetime({ offset: true }),
    to: z.iso.datetime({ offset: true }),
  }),
  status: z.literal("PLANNED"),
});
type MeasurementResponseType = z.infer<typeof MeasurementResponse>;

const schemaRoute = {
  querystring: z.object({
    bounds: z
      .string()
      .regex(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/)
      .transform((val): number[] | undefined => (val ? val.split(",").map(Number) : undefined)),
  }),
};
type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };

function buildWmsParams(bbox: string): URLSearchParams {
  const layers = "public:planned_measures";
  return new URLSearchParams({
    REQUEST: "GetFeature",
    SERVICE: "WFS",
    VERSION: "2.0.0",
    TYPENAMES: layers,
    FORMAT: "image/png",
    BBOX: `${bbox},EPSG:4326`,
    outputFormat: "application/json",
  });
}

async function fetchWmsReports(bbox: string): Promise<MeasurementResponseType[] | null> {
  const res = await fetch(`${WMS_URL}?${buildWmsParams(bbox).toString()}`, {
    headers: {
      Accept: "application/json",
      Origin: "https://si2pem.gov.pl",
    },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as WmsFeatureCollection;
  if (!json.features?.length) return null;
  const data = parseWmsReports(json.features);
  return data.length ? data : null;
}

function parseWmsReports(features: WmsFeature[]): MeasurementResponseType[] {
  const seen = new Set<string>();
  return features.reduce<MeasurementResponseType[]>((acc, feature) => {
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
      station_id: station_id ?? "",
      date: {
        from: new Date(`${date_from} 02:00:00 UTC+2`).toISOString(),
        to: new Date(`${date_to} 02:00:00 UTC+2`).toISOString(),
      },
      lab: {
        PCA: laboratory_pca,
        name: laboratory_name,
      },
      location: {
        latitude: lat,
        longitude: lng,
        city,
        address,
      },
      operator: installation_operator_name,
      status: "PLANNED",
    });
    return acc;
  }, []);
}

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<MeasurementResponseType[]>>) {
  const { bounds } = req.query;

  const [la1, lo1, la2, lo2] = bounds as [number, number, number, number];
  const [west, south] = [Math.min(lo1, lo2), Math.min(la1, la2)];
  const [east, north] = [Math.max(lo1, lo2), Math.max(la1, la2)];
  const bbox = `${south},${west},${north},${east}`;

  const cacheKey = `pem:map:${bbox}`;
  const cached = await redis.get(cacheKey);
  if (cached) return res.send(JSON.parse(cached));

  const wmsResults = await fetchWmsReports(bbox);
  console.log(wmsResults);
  if (!wmsResults?.length) throw new ErrorResponse("NOT_FOUND");
  const response = { data: wmsResults };
  await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(response));
  return res.send(response);
}

export const mapMeasurements: Route<ReqQuery, MeasurementResponseType[]> = {
  method: "GET",
  url: "/pem/map",
  config: { allowGuestAccess: true },
  schema: schemaRoute,
  handler,
};

export default mapMeasurements;
