import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import redis from "../../../../database/redis.js";
import { ErrorResponse } from "../../../../errors.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const WMS_URL = "https://si2pem.gov.pl/geoserver/public/wms";
const CACHE_TTL = 86400; // 24h

interface PemReport {
  url: string;
  date: string;
  year: number;
  source: string;
  number: string;
  intensity: number;
  feature_id: string;
}

type Params = { Params: { station_id: string }; Querystring: { lat: number; lng: number } };

const schemaRoute = {
  params: z.object({
    station_id: z.string(),
  }),
  querystring: z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
  }),
  response: {
    200: z.object({
      data: z.array(
        z.object({
          url: z.string(),
          date: z.string(),
          year: z.number(),
          source: z.string(),
          number: z.string(),
          intensity: z.number(),
          feature_id: z.string(),
        }),
      ),
    }),
  },
};

type WmsFeature = {
  id: string;
  properties: {
    url: string | null;
    date: string;
    year: number;
    source: string;
    number: string;
    intensity: number;
  };
};

type WmsResponse = { features: WmsFeature[] };

function buildWmsParams(identityName: string, lat: number, lng: number, featureCount: number): URLSearchParams {
  const bbox = `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`;
  return new URLSearchParams({
    SERVICE: "WMS",
    VERSION: "1.1.1",
    REQUEST: "GetFeatureInfo",
    SRS: "EPSG:4326",
    LAYERS: "measures",
    QUERY_LAYERS: "measures",
    INFO_FORMAT: "application/json",
    FEATURE_COUNT: String(featureCount),
    WIDTH: "100",
    HEIGHT: "100",
    X: "50",
    Y: "50",
    FORMAT: "image/png",
    BBOX: bbox,
    CQL_FILTER: `identity_names='${identityName}' AND is_old=false AND url IS NOT NULL`,
    SORTBY: "year D,date D",
  });
}

function parseReports(features: WmsFeature[]): PemReport[] {
  const sorted = [...features].sort((a, b) => {
    if (b.properties.year !== a.properties.year) return b.properties.year - a.properties.year;
    return b.properties.date.localeCompare(a.properties.date);
  });
  const seen = new Set<string>();
  return sorted.reduce<PemReport[]>((acc, feature) => {
    const { url, date, year, source, number, intensity } = feature.properties;
    if (!url || seen.has(url)) return acc;
    seen.add(url);
    acc.push({ url, date, year, source, number, intensity, feature_id: feature.id });
    return acc;
  }, []);
}

async function fetchAllReports(identityName: string, lat: number, lng: number): Promise<PemReport[]> {
  const res = await fetch(`${WMS_URL}?${buildWmsParams(identityName, lat, lng, 200).toString()}`);
  if (!res.ok) throw new ErrorResponse("INTERNAL_SERVER_ERROR");
  const json = (await res.json()) as WmsResponse;
  if (!json.features?.length) throw new ErrorResponse("NOT_FOUND");
  const data = parseReports(json.features);
  if (!data.length) throw new ErrorResponse("NOT_FOUND");
  return data;
}

async function fetchLatestDate(identityName: string, lat: number, lng: number): Promise<string | null> {
  const res = await fetch(`${WMS_URL}?${buildWmsParams(identityName, lat, lng, 200).toString()}`);
  if (!res.ok) return null;
  const json = (await res.json()) as WmsResponse;
  if (!json.features?.length) return null;
  return json.features.reduce<string | null>((max, f) => {
    if (!max || f.properties.date > max) return f.properties.date;
    return max;
  }, null);
}

async function handler(req: FastifyRequest<Params>, res: ReplyPayload<JSONBody<PemReport[]>>) {
  const { station_id } = req.params;
  const { lat, lng } = req.query;

  const cacheKey = `pem:${station_id}:${lat}:${lng}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    const cachedResponse = JSON.parse(cached) as { data: PemReport[] };
    const cachedLatestDate = cachedResponse.data[0]?.date ?? null;
    const si2pemLatestDate = await fetchLatestDate(station_id, lat, lng);

    if (si2pemLatestDate === null || si2pemLatestDate <= (cachedLatestDate ?? "")) return res.send(cachedResponse);
  }

  const data = await fetchAllReports(station_id, lat, lng);
  const response = { data };
  await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(response));
  return res.send(response);
}

const getPemByStationId: Route<Params, PemReport[]> = {
  url: "/pem/:station_id",
  method: "GET",
  config: { allowGuestAccess: true },
  schema: schemaRoute,
  handler,
};

export default getPemByStationId;
