import { sql, type SQL, inArray, and, countDistinct, eq } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { bands, operators, ukePermits, ukeLocations, regions, stationsPermits } from "@openbts/drizzle";
import db from "../../../../../database/psql.js";
import redis from "../../../../../database/redis.js";
import { ErrorResponse } from "../../../../../errors.js";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const ukeLocationsSchema = createSelectSchema(ukeLocations)
  .omit({ point: true, region_id: true })
  .extend({ createdAt: z.string().datetime({ offset: true }), updatedAt: z.string().datetime({ offset: true }) });
const ukePermitsSchema = createSelectSchema(ukePermits)
  .omit({ location_id: true, operator_id: true, band_id: true })
  .extend({
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    expiry_date: z.string().datetime({ offset: true }),
  });
const bandsSchema = createSelectSchema(bands);
const operatorsSchema = createSelectSchema(operators);
const regionsSchema = createSelectSchema(regions);

const permitResponseSchema = ukePermitsSchema.extend({
  band: bandsSchema.nullable(),
  operator: operatorsSchema.nullable(),
});

const locationResponseSchema = ukeLocationsSchema.extend({
  region: regionsSchema,
});

const stationResponseSchema = z.object({
  station_id: z.string(),
  operator: operatorsSchema.nullable(),
  location: locationResponseSchema.nullable(),
  permits: z.array(permitResponseSchema),
});

const schemaRoute = {
  querystring: z.object({
    limit: z.coerce.number().min(1).max(200).optional().default(50),
    page: z.coerce.number().min(1).default(1),
    operators: z
      .string()
      .regex(/^\d+(,\d+)*$/)
      .optional()
      .transform((val): number[] | undefined =>
        val
          ? val
              .split(",")
              .map(Number)
              .filter((n) => !Number.isNaN(n))
          : undefined,
      ),
    regions: z
      .string()
      .regex(/^[A-Z]{3}(,[A-Z]{3})*$/)
      .optional()
      .transform((val): string[] | undefined => (val ? val.split(",").filter(Boolean) : undefined)),
  }),
  response: {
    200: z.object({
      data: z.array(stationResponseSchema),
      totalCount: z.number(),
    }),
  },
};

type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };
type StationData = z.infer<typeof stationResponseSchema>;
type ResponseBody = { data: StationData[]; totalCount: number };

const CACHE_TTL = 30;

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResponseBody>>) {
  const cacheKey = `uke:permits:unassigned:${JSON.stringify(req.query)}`;
  const cached = await redis.get(cacheKey);
  if (cached) return res.send(JSON.parse(cached));

  const { limit, page, operators: operatorMncs, regions: regionNames } = req.query;
  const offset = (page - 1) * limit;
  const expandedOperatorMncs = operatorMncs?.includes(26034) ? [...new Set([...operatorMncs, 26002, 26003])] : operatorMncs;

  const [operatorRows, regionsRows] = await Promise.all([
    expandedOperatorMncs?.length
      ? db.query.operators.findMany({
          columns: { id: true },
          where: { mnc: { in: expandedOperatorMncs } },
        })
      : [],
    regionNames?.length
      ? db.query.regions.findMany({
          columns: { id: true },
          where: { code: { in: regionNames } },
        })
      : [],
  ]);

  const operatorIds = operatorRows.map((r) => r.id);
  const regionIds = regionsRows.map((r) => r.id);

  const buildBaseConditions = (): SQL<unknown>[] => {
    const conditions: SQL<unknown>[] = [sql`${stationsPermits.id} IS NULL`];
    if (operatorIds.length) conditions.push(inArray(ukePermits.operator_id, operatorIds));
    if (regionIds.length) {
      conditions.push(
        sql`${ukePermits.location_id} IN (SELECT ${ukeLocations.id} FROM ${ukeLocations} WHERE ${inArray(ukeLocations.region_id, regionIds)})`,
      );
    }
    return conditions;
  };

  try {
    const baseConditions = buildBaseConditions();
    const whereClause = and(...baseConditions)!;

    const [countResult, stationIdRows] = await Promise.all([
      db
        .select({ count: countDistinct(ukePermits.station_id) })
        .from(ukePermits)
        .leftJoin(stationsPermits, eq(stationsPermits.permit_id, ukePermits.id))
        .where(whereClause),
      db
        .select({ station_id: ukePermits.station_id })
        .from(ukePermits)
        .leftJoin(stationsPermits, eq(stationsPermits.permit_id, ukePermits.id))
        .where(whereClause)
        .groupBy(ukePermits.station_id)
        .orderBy(sql`MAX(${ukePermits.id}) DESC`)
        .limit(limit)
        .offset(offset),
    ]);

    const totalCount = countResult[0]?.count ?? 0;
    const stationIds = stationIdRows.map((r) => r.station_id);
    if (!stationIds.length) return res.send({ data: [], totalCount });

    const rows = await db
      .select({
        station_id: ukePermits.station_id,
        operator: sql<z.infer<typeof operatorsSchema> | null>`(
          array_agg(
            json_build_object(
              'id',        ${operators.id},
              'name',      ${operators.name},
              'full_name', ${operators.full_name},
              'parent_id', ${operators.parent_id},
              'mnc',       ${operators.mnc}
            ) ORDER BY ${ukePermits.id}
          ) FILTER (WHERE ${operators.id} IS NOT NULL)
        )[1]`,
        location: sql<z.infer<typeof locationResponseSchema> | null>`(
          array_agg(
            json_build_object(
              'id',        ${ukeLocations.id},
              'city',      ${ukeLocations.city},
              'address',   ${ukeLocations.address},
              'longitude', ${ukeLocations.longitude},
              'latitude',  ${ukeLocations.latitude},
              'createdAt', ${ukeLocations.createdAt},
              'updatedAt', ${ukeLocations.updatedAt},
              'region', json_build_object(
                'id',   ${regions.id},
                'name', ${regions.name},
                'code', ${regions.code}
              )
            ) ORDER BY ${ukePermits.id}
          ) FILTER (WHERE ${ukeLocations.id} IS NOT NULL)
        )[1]`,
        permits: sql<z.infer<typeof permitResponseSchema>[]>`
          json_agg(
            json_build_object(
              'id',              ${ukePermits.id},
              'station_id',      ${ukePermits.station_id},
              'decision_number', ${ukePermits.decision_number},
              'decision_type',   ${ukePermits.decision_type},
              'expiry_date',     ${ukePermits.expiry_date},
              'source',          ${ukePermits.source},
              'createdAt',       ${ukePermits.createdAt},
              'updatedAt',       ${ukePermits.updatedAt},
              'band', json_build_object(
                'id',      ${bands.id},
                'value',   ${bands.value},
                'rat',     ${bands.rat},
                'name',    ${bands.name},
                'duplex',  ${bands.duplex},
                'variant', ${bands.variant}
              ),
              'operator', json_build_object(
                'id',        ${operators.id},
                'name',      ${operators.name},
                'full_name', ${operators.full_name},
                'parent_id', ${operators.parent_id},
                'mnc',       ${operators.mnc}
              )
            ) ORDER BY ${ukePermits.id}
          ) FILTER (WHERE ${ukePermits.id} IS NOT NULL)`,
      })
      .from(ukePermits)
      .leftJoin(stationsPermits, eq(stationsPermits.permit_id, ukePermits.id))
      .leftJoin(operators, eq(operators.id, ukePermits.operator_id))
      .leftJoin(ukeLocations, eq(ukeLocations.id, ukePermits.location_id))
      .leftJoin(regions, eq(regions.id, ukeLocations.region_id))
      .leftJoin(bands, eq(bands.id, ukePermits.band_id))
      .where(
        and(
          sql`${stationsPermits.id} IS NULL`,
          inArray(ukePermits.station_id, stationIds),
          ...(operatorIds.length ? [inArray(ukePermits.operator_id, operatorIds)] : []),
        ),
      )
      .groupBy(ukePermits.station_id)
      .orderBy(sql`MAX(${ukePermits.id}) DESC`);

    const stationMap = new Map(rows.map((r) => [r.station_id, r]));
    const data = stationIds.map((id) => stationMap.get(id)!).filter(Boolean) as StationData[];

    await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify({ data, totalCount }));
    return res.send({ data, totalCount });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("INTERNAL_SERVER_ERROR", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

const getUnassignedUkePermits: Route<ReqQuery, ResponseBody> = {
  url: "/uke/permits/unassigned",
  method: "GET",
  config: { permissions: ["read:uke_permits_orphaned"], allowGuestAccess: false },
  schema: schemaRoute,
  handler,
};

export default getUnassignedUkePermits;
