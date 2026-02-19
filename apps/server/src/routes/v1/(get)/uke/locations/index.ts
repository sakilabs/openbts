import { sql, type SQL, inArray, and, count } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { bands, operators, ukePermits, ukeLocations, regions } from "@openbts/drizzle";
import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";
const ukeLocationsSchema = createSelectSchema(ukeLocations).omit({ point: true, region_id: true });
const ukePermitsSchema = createSelectSchema(ukePermits).omit({ location_id: true, operator_id: true, band_id: true });
const bandsSchema = createSelectSchema(bands);
const operatorsSchema = createSelectSchema(operators);
const regionsSchema = createSelectSchema(regions);

const permitResponseSchema = ukePermitsSchema.extend({
  band: bandsSchema.nullable(),
  operator: operatorsSchema.nullable(),
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
    new: z.coerce.boolean().optional().default(false),
  }),
  response: {
    200: z.object({
      data: z.array(
        ukeLocationsSchema.extend({
          region: regionsSchema,
          permits: z.array(permitResponseSchema),
        }),
      ),
      totalCount: z.number(),
    }),
  },
};
type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };
type PermitData = z.infer<typeof permitResponseSchema>;
type ResponseData = z.infer<typeof ukeLocationsSchema> & {
  region: z.infer<typeof regionsSchema>;
  permits: PermitData[];
};
type ResponseBody = { data: ResponseData[]; totalCount: number };
async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResponseBody>>) {
  const { bounds, limit, page, rat, operators: operatorMncs, bands: bandValues, regions: regionNames, new: recentOnly } = req.query;
  const offset = (page - 1) * limit;
  const expandedOperatorMncs = operatorMncs?.includes(26034) ? [...new Set([...operatorMncs, 26002, 26003])] : operatorMncs;
  let envelope: ReturnType<typeof sql> | undefined;
  if (bounds) {
    const [la1, lo1, la2, lo2] = bounds as [number, number, number, number];
    const [west, south] = [Math.min(lo1, lo2), Math.min(la1, la2)];
    const [east, north] = [Math.max(lo1, lo2), Math.max(la1, la2)];
    envelope = sql`ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)`;
  }
  const [bandRows, operatorRows, regionsRows] = await Promise.all([
    bandValues?.length
      ? db.query.bands.findMany({
          columns: { id: true },
          where: { value: { in: bandValues } },
        })
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
  const bandIds = bandRows.map((b) => b.id);
  const operatorIds = operatorRows.map((r) => r.id);
  const regionIds = regionsRows.map((r) => r.id);
  if (bandValues?.length && !bandIds.length) return res.send({ data: [], totalCount: 0 });
  const requestedRats = rat ?? [];
  type RatType = "GSM" | "UMTS" | "LTE" | "NR" | "CDMA" | "IOT";
  const ratMap: Record<string, RatType> = { gsm: "GSM", umts: "UMTS", lte: "LTE", "5g": "NR", cdma: "CDMA", iot: "IOT" } as const;
  const wantsGsmR = requestedRats.includes("gsm-r");
  const standardRats = requestedRats.filter((r) => r !== "gsm-r");
  const mappedRats: RatType[] = standardRats.map((r) => ratMap[r]).filter((r): r is RatType => r !== undefined);
  const hasPermitFilters = operatorIds.length || bandIds.length || mappedRats.length || wantsGsmR;
  const buildLocationOnlyConditions = (locFields: typeof ukeLocations): SQL<unknown>[] => {
    const conditions: SQL<unknown>[] = [];
    if (envelope) conditions.push(sql`ST_Intersects(${locFields.point}, ${envelope})`);
    if (regionIds.length) conditions.push(inArray(locFields.region_id, regionIds));
    if (recentOnly) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      conditions.push(sql`(${locFields.createdAt} >= ${thirtyDaysAgo.toISOString()} OR ${locFields.updatedAt} >= ${thirtyDaysAgo.toISOString()})`);
    }
    return conditions;
  };

  const buildPermitFilter = (fields: typeof ukePermits): SQL<unknown>[] => {
    const conditions: SQL<unknown>[] = [];
    if (operatorIds.length) conditions.push(inArray(fields.operator_id, operatorIds));
    if (bandIds.length) conditions.push(inArray(fields.band_id, bandIds));
    if (mappedRats.length || wantsGsmR) {
      const ratConditions: SQL<unknown>[] = [];
      if (mappedRats.length) {
        const wantsRegularGsm = mappedRats.includes("GSM");
        const nonGsmRats = mappedRats.filter((r) => r !== "GSM");
        if (nonGsmRats.length) ratConditions.push(inArray(bands.rat, nonGsmRats));
        if (wantsRegularGsm) ratConditions.push(sql`(${bands.rat} = 'GSM' AND ${bands.variant} = 'commercial')`);
      }
      if (wantsGsmR) ratConditions.push(sql`(${bands.rat} = 'GSM' AND ${bands.variant} = 'railway')`);
      if (ratConditions.length) {
        conditions.push(
          sql`EXISTS (
          SELECT 1 FROM ${bands}
          WHERE ${bands.id} = ${fields.band_id}
          AND (${sql.join(ratConditions, sql` OR `)})
        )`,
        );
      }
    }
    return conditions;
  };

  const buildPermitExistsCondition = (locationIdCol: typeof ukeLocations.id): SQL => {
    const conditions: SQL<unknown>[] = [sql`${ukePermits.location_id} = ${locationIdCol}`];
    if (operatorIds.length) conditions.push(inArray(ukePermits.operator_id, operatorIds));
    if (bandIds.length) conditions.push(inArray(ukePermits.band_id, bandIds));
    if (mappedRats.length || wantsGsmR) {
      const ratConditions: SQL<unknown>[] = [];
      if (mappedRats.length) {
        const wantsRegularGsm = mappedRats.includes("GSM");
        const nonGsmRats = mappedRats.filter((r) => r !== "GSM");
        if (nonGsmRats.length) ratConditions.push(inArray(bands.rat, nonGsmRats));
        if (wantsRegularGsm) ratConditions.push(sql`(${bands.rat} = 'GSM' AND ${bands.variant} = 'commercial')`);
      }
      if (wantsGsmR) ratConditions.push(sql`(${bands.rat} = 'GSM' AND ${bands.variant} = 'railway')`);
      if (ratConditions.length) {
        conditions.push(
          sql`EXISTS (
          SELECT 1 FROM ${bands}
          WHERE ${bands.id} = ${ukePermits.band_id}
          AND (${sql.join(ratConditions, sql` OR `)})
        )`,
        );
      }
    }
    return sql`EXISTS (SELECT 1 FROM ${ukePermits} WHERE ${and(...conditions)})`;
  };

  try {
    const locationConditions = buildLocationOnlyConditions(ukeLocations);
    if (hasPermitFilters) locationConditions.push(buildPermitExistsCondition(ukeLocations.id));

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

    const [totalCount, locationRows] = await Promise.all([
      runCountQuery(),
      db.query.ukeLocations.findMany({
        with: {
          region: true,
          permits: {
            columns: { location_id: false, operator_id: false, band_id: false },
            with: {
              band: true,
              operator: true,
            },
            ...(hasPermitFilters
              ? {
                  where: {
                    RAW: (fields) => {
                      const conditions = buildPermitFilter(fields);
                      return and(...conditions) ?? sql`true`;
                    },
                  },
                }
              : {}),
          },
        },
        columns: {
          point: false,
          region_id: false,
        },
        where: {
          RAW: (fields) => {
            const conditions = buildLocationOnlyConditions(fields);
            if (hasPermitFilters) conditions.push(buildPermitExistsCondition(fields.id));
            return and(...conditions) ?? sql`true`;
          },
        },
        limit,
        offset,
        orderBy: { id: "desc" },
      }),
    ]);
    return res.send({ data: locationRows, totalCount });
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
