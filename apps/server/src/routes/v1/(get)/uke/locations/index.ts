import { sql, type SQL, inArray, and, count, eq, desc } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { bands, operators, ukePermits, ukeLocations, regions } from "@openbts/drizzle";
import db from "../../../../../database/psql.js";
import redis from "../../../../../database/redis.js";
import { ErrorResponse } from "../../../../../errors.js";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const ukeLocationsSchema = createSelectSchema(ukeLocations)
  .omit({ point: true, region_id: true })
  .extend({ createdAt: z.iso.datetime({ offset: true }), updatedAt: z.iso.datetime({ offset: true }) });
const ukePermitsSchema = createSelectSchema(ukePermits)
  .omit({ location_id: true, operator_id: true, band_id: true })
  .extend({
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
    expiry_date: z.iso.datetime({ offset: true }),
  });
const bandsSchema = createSelectSchema(bands);
const operatorsSchema = createSelectSchema(operators);
const regionsSchema = createSelectSchema(regions);

const permitResponseSchema = ukePermitsSchema.extend({
  band: bandsSchema.nullable(),
  operator: operatorsSchema.nullable(),
});

const responseSchema = z.object({
  data: z.array(
    ukeLocationsSchema.extend({
      region: regionsSchema,
      permits: z.array(permitResponseSchema),
    }),
  ),
  totalCount: z.number(),
});

const schemaRoute = {
  querystring: z.object({
    bounds: z
      .string()
      .regex(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/)
      .optional()
      .transform((val): number[] | undefined => (val ? val.split(",").map(Number) : undefined)),
    limit: z.coerce.number().min(1).max(1000).optional().default(500),
    page: z.coerce.number().min(1).default(1),
    rat: z
      .string()
      .regex(/^(?:cdma|umts|gsm|gsm-r|lte|5g|iot)(?:,(?:cdma|umts|gsm|gsm-r|lte|5g|iot))*$/i)
      .optional()
      .transform((val): string[] | undefined => (val ? val.toLowerCase().split(",").filter(Boolean) : undefined)),
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
    bands: z
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
    new: z
      .string()
      .optional()
      .transform((val): number | null => {
        if (!val || val === "false" || val === "0") return null;
        if (val === "true") return 30;
        const n = Number(val);
        return n >= 1 && n <= 30 ? n : null;
      }),
  }),
  response: {
    200: z.toJSONSchema(responseSchema),
  },
};

type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };
type PermitData = z.infer<typeof permitResponseSchema>;
type ResponseData = z.infer<typeof ukeLocationsSchema> & {
  region: z.infer<typeof regionsSchema>;
  permits: PermitData[];
};
type ResponseBody = { data: ResponseData[]; totalCount: number };

const CACHE_TTL = 30;

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResponseBody>>) {
  const cacheKey = `uke:loc:${JSON.stringify(req.query)}`;
  const cached = await redis.get(cacheKey);

  if (cached) return res.send(JSON.parse(cached));

  const { bounds, limit, page, rat, operators: operatorMncs, bands: bandValues, regions: regionNames, new: recentDays } = req.query;
  const offset = (page - 1) * limit;
  const expandedOperatorMncs = operatorMncs?.includes(26034) ? [...new Set([...operatorMncs, 26002, 26003])] : operatorMncs;

  let envelope: ReturnType<typeof sql> | undefined;
  if (bounds) {
    const [la1, lo1, la2, lo2] = bounds as [number, number, number, number];
    const [west, south] = [Math.min(lo1, lo2), Math.min(la1, la2)];
    const [east, north] = [Math.max(lo1, lo2), Math.max(la1, la2)];
    envelope = sql`ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)`;
  }

  const requestedRats = rat ?? [];
  type RatType = "GSM" | "UMTS" | "LTE" | "NR" | "CDMA" | "IOT";
  const ratMap: Record<string, RatType> = { gsm: "GSM", umts: "UMTS", lte: "LTE", "5g": "NR", cdma: "CDMA", iot: "IOT" } as const;
  const wantsGsmR = requestedRats.includes("gsm-r");
  const standardRats = requestedRats.filter((r) => r !== "gsm-r");
  const mappedRats: RatType[] = standardRats.map((r) => ratMap[r]).filter((r): r is RatType => r !== undefined);

  const bandConditions: SQL<unknown>[] = [];
  if (bandValues?.length) bandConditions.push(inArray(bands.value, bandValues));
  if (mappedRats.length || wantsGsmR) {
    const ratConds: SQL<unknown>[] = [];
    if (mappedRats.length) {
      const wantsRegularGsm = mappedRats.includes("GSM");
      const nonGsmRats = mappedRats.filter((r) => r !== "GSM");
      if (nonGsmRats.length) ratConds.push(inArray(bands.rat, nonGsmRats));
      if (wantsRegularGsm) ratConds.push(sql`(${bands.rat} = 'GSM' AND ${bands.variant} = 'commercial')`);
    }
    if (wantsGsmR) ratConds.push(sql`(${bands.rat} = 'GSM' AND ${bands.variant} = 'railway')`);
    if (ratConds.length) bandConditions.push(sql`(${sql.join(ratConds, sql` OR `)})`);
  }
  const hasBandFilters = bandConditions.length > 0;

  const [eligibleBandRows, operatorRows, regionsRows] = await Promise.all([
    hasBandFilters
      ? db
          .select({ id: bands.id })
          .from(bands)
          .where(and(...bandConditions))
      : [],
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

  const eligibleBandIds = eligibleBandRows.map((b) => b.id);
  const operatorIds = operatorRows.map((r) => r.id);
  const regionIds = regionsRows.map((r) => r.id);
  if (hasBandFilters && !eligibleBandIds.length) return res.send({ data: [], totalCount: 0 });

  const hasPermitFilters = operatorIds.length > 0 || eligibleBandIds.length > 0;

  const buildLocationOnlyConditions = (locFields: typeof ukeLocations): SQL<unknown>[] => {
    const conditions: SQL<unknown>[] = [];
    if (envelope) conditions.push(sql`${locFields.point} && ${envelope}`);
    if (regionIds.length) conditions.push(inArray(locFields.region_id, regionIds));
    if (recentDays) {
      const cutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
      conditions.push(sql`GREATEST(${locFields.createdAt}, ${locFields.updatedAt}) >= ${cutoff.toISOString()}`);
    }
    return conditions;
  };

  const buildPermitExistsCondition = (locationIdCol: typeof ukeLocations.id): SQL => {
    const conditions: SQL<unknown>[] = [sql`${ukePermits.location_id} = ${locationIdCol}`];
    if (operatorIds.length) conditions.push(inArray(ukePermits.operator_id, operatorIds));
    if (eligibleBandIds.length) conditions.push(inArray(ukePermits.band_id, eligibleBandIds));
    return sql`EXISTS (SELECT 1 FROM ${ukePermits} WHERE ${and(...conditions)})`;
  };

  try {
    const locationConditions = buildLocationOnlyConditions(ukeLocations);
    if (hasPermitFilters) locationConditions.push(buildPermitExistsCondition(ukeLocations.id));

    const permitJoinCondition = hasPermitFilters
      ? and(
          eq(ukePermits.location_id, ukeLocations.id),
          ...(operatorIds.length ? [inArray(ukePermits.operator_id, operatorIds)] : []),
          ...(eligibleBandIds.length ? [inArray(ukePermits.band_id, eligibleBandIds)] : []),
        )
      : eq(ukePermits.location_id, ukeLocations.id);

    const permitsAgg = sql<PermitData[]>`
      COALESCE(
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
        ) FILTER (WHERE ${ukePermits.id} IS NOT NULL),
        '[]'::json
      )`;

    const runCountQuery = async (): Promise<number> => {
      if (!locationConditions.length) {
        const result = await db.select({ count: count() }).from(ukeLocations);
        return result[0]?.count ?? 0;
      }
      const result = await db
        .select({ count: count() })
        .from(ukeLocations)
        .where(and(...locationConditions));
      return result[0]?.count ?? 0;
    };

    const [totalCount, rows] = await Promise.all([
      runCountQuery(),
      db
        .select({
          id: ukeLocations.id,
          city: ukeLocations.city,
          address: ukeLocations.address,
          longitude: ukeLocations.longitude,
          latitude: ukeLocations.latitude,
          createdAt: ukeLocations.createdAt,
          updatedAt: ukeLocations.updatedAt,
          region: sql<z.infer<typeof regionsSchema>>`json_build_object(
            'id',   ${regions.id},
            'name', ${regions.name},
            'code', ${regions.code}
          )`,
          permits: permitsAgg,
        })
        .from(ukeLocations)
        .innerJoin(regions, eq(regions.id, ukeLocations.region_id))
        .leftJoin(ukePermits, permitJoinCondition)
        .leftJoin(bands, eq(bands.id, ukePermits.band_id))
        .leftJoin(operators, eq(operators.id, ukePermits.operator_id))
        .where(locationConditions.length ? and(...locationConditions) : undefined)
        .groupBy(ukeLocations.id, regions.id)
        .orderBy(desc(ukeLocations.id))
        .limit(limit)
        .offset(offset),
    ]);

    const data = rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })) as ResponseData[];

    await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify({ data, totalCount }));
    return res.send({ data, totalCount });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("INTERNAL_SERVER_ERROR", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

const getUkeLocations: Route<ReqQuery, ResponseBody> = {
  url: "/uke/locations",
  method: "GET",
  config: { permissions: ["read:uke_permits"], allowGuestAccess: true },
  schema: schemaRoute,
  handler,
};

export default getUkeLocations;
