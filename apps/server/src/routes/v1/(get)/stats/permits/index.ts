import { count, countDistinct, eq } from "drizzle-orm";
import { z } from "zod/v4";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";
import db from "../../../../../database/psql.js";
import redis from "../../../../../database/redis.js";
import { ukePermits, bands, operators, cells, stations } from "@openbts/drizzle";

const CACHE_TTL = 86400; // 24h

const internalRowSchema = z.object({
  operator: z.object({ id: z.number(), name: z.string() }),
  band: z.object({ id: z.number(), name: z.string(), rat: z.string() }),
  stations: z.number(),
  cells: z.number(),
  share_pct: z.number(),
});

const schemaRoute = {
  querystring: z.object({
    operator_id: z.coerce.number().int().optional(),
  }),
  response: {
    200: z.object({
      data: z.object({
        uke: z.array(
          z.object({
            operator: z.object({ id: z.number(), name: z.string() }),
            band: z.object({ id: z.number(), name: z.string(), rat: z.string() }),
            unique_stations: z.number(),
            permits_count: z.number(),
            share_pct: z.number(),
          }),
        ),
        internal: z.array(internalRowSchema),
      }),
    }),
  },
};

type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };

interface PermitRow {
  operator: { id: number; name: string };
  band: { id: number; name: string; rat: string };
  unique_stations: number;
  permits_count: number;
  share_pct: number;
}

interface InternalRow {
  operator: { id: number; name: string };
  band: { id: number; name: string; rat: string };
  stations: number;
  cells: number;
  share_pct: number;
}

interface PermitsResponse {
  uke: PermitRow[];
  internal: InternalRow[];
}

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<PermitsResponse>>) {
  const { operator_id } = req.query;
  const cacheKey = `stats:permits${operator_id ? `:op:${operator_id}` : ""}`;

  const cached = await redis.get(cacheKey);
  if (cached) return res.send(JSON.parse(cached));

  const ukeWhere = operator_id ? eq(ukePermits.operator_id, operator_id) : undefined;
  const stationWhere = operator_id ? eq(stations.operator_id, operator_id) : undefined;

  const [ukeRows, internalRows] = await Promise.all([
    db
      .select({
        operator_id: operators.id,
        operator_name: operators.name,
        band_id: bands.id,
        band_name: bands.name,
        band_rat: bands.rat,
        unique_stations: countDistinct(ukePermits.station_id),
        permits_count: count(),
      })
      .from(ukePermits)
      .innerJoin(operators, eq(ukePermits.operator_id, operators.id))
      .innerJoin(bands, eq(ukePermits.band_id, bands.id))
      .where(ukeWhere)
      .groupBy(operators.id, operators.name, bands.id, bands.name, bands.rat),

    db
      .select({
        operator_id: operators.id,
        operator_name: operators.name,
        band_id: bands.id,
        band_name: bands.name,
        band_rat: bands.rat,
        stations: countDistinct(cells.station_id),
        cells: count(),
      })
      .from(cells)
      .innerJoin(stations, eq(cells.station_id, stations.id))
      .innerJoin(operators, eq(stations.operator_id, operators.id))
      .innerJoin(bands, eq(cells.band_id, bands.id))
      .where(stationWhere)
      .groupBy(operators.id, operators.name, bands.id, bands.name, bands.rat),
  ]);

  const ukeOperatorTotals = new Map<number, number>();
  for (const row of ukeRows) {
    ukeOperatorTotals.set(row.operator_id, (ukeOperatorTotals.get(row.operator_id) ?? 0) + row.unique_stations);
  }

  const internalOperatorTotals = new Map<number, number>();
  for (const row of internalRows) {
    internalOperatorTotals.set(row.operator_id, (internalOperatorTotals.get(row.operator_id) ?? 0) + row.stations);
  }

  const response = {
    data: {
      uke: ukeRows.map((row) => {
        const total = ukeOperatorTotals.get(row.operator_id) ?? 0;
        return {
          operator: { id: row.operator_id, name: row.operator_name },
          band: { id: row.band_id, name: row.band_name, rat: row.band_rat },
          unique_stations: row.unique_stations,
          permits_count: row.permits_count,
          share_pct: total > 0 ? Math.round((row.unique_stations / total) * 1000) / 10 : 0,
        };
      }),
      internal: internalRows.map((row) => {
        const total = internalOperatorTotals.get(row.operator_id) ?? 0;
        return {
          operator: { id: row.operator_id, name: row.operator_name },
          band: { id: row.band_id, name: row.band_name, rat: row.band_rat },
          stations: row.stations,
          cells: row.cells,
          share_pct: total > 0 ? Math.round((row.stations / total) * 1000) / 10 : 0,
        };
      }),
    },
  };

  await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(response));
  res.send(response);
}

const getStatsPermits: Route<ReqQuery, PermitsResponse> = {
  url: "/stats/permits",
  method: "GET",
  schema: schemaRoute,
  config: { permissions: ["read:stats"], allowGuestAccess: true },
  handler,
};

export default getStatsPermits;
