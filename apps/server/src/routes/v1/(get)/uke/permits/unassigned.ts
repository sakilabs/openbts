import { sql, type SQL, inArray, and, countDistinct } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { bands, operators, ukePermits, ukeLocations, regions, stationsPermits } from "@openbts/drizzle";
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
    limit: z.coerce.number().min(1).max(1000).optional().default(500),
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

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResponseBody>>) {
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

  const buildPermitConditions = (): SQL<unknown>[] => {
    const conditions: SQL<unknown>[] = [sql`NOT EXISTS (SELECT 1 FROM ${stationsPermits} WHERE ${stationsPermits.permit_id} = ${ukePermits.id})`];
    if (operatorIds.length) conditions.push(inArray(ukePermits.operator_id, operatorIds));
    if (regionIds.length) {
      conditions.push(
        sql`${ukePermits.location_id} IN (SELECT ${ukeLocations.id} FROM ${ukeLocations} WHERE ${inArray(ukeLocations.region_id, regionIds)})`,
      );
    }
    return conditions;
  };

  try {
    const permitConditions = buildPermitConditions();
    const whereClause = and(...permitConditions)!;

    const [countResult, stationIdRows] = await Promise.all([
      db
        .select({ count: countDistinct(ukePermits.station_id) })
        .from(ukePermits)
        .where(whereClause),
      db
        .select({ station_id: ukePermits.station_id })
        .from(ukePermits)
        .where(whereClause)
        .groupBy(ukePermits.station_id)
        .orderBy(sql`MAX(${ukePermits.id}) DESC`)
        .limit(limit)
        .offset(offset),
    ]);

    const totalCount = countResult[0]?.count ?? 0;
    const stationIds = stationIdRows.map((r) => r.station_id);

    if (!stationIds.length) return res.send({ data: [], totalCount });

    const permits = await db.query.ukePermits.findMany({
      columns: { operator_id: false, band_id: false, location_id: false },
      with: {
        band: true,
        operator: true,
        location: {
          columns: { point: false, region_id: false },
          with: { region: true },
        },
      },
      where: {
        RAW: (fields) =>
          and(
            inArray(fields.station_id, stationIds),
            sql`NOT EXISTS (SELECT 1 FROM ${stationsPermits} WHERE ${stationsPermits.permit_id} = ${fields.id})`,
            ...(operatorIds.length ? [inArray(fields.operator_id, operatorIds)] : []),
          )!,
      },
    });

    const stationMap = new Map<string, StationData>();
    for (const permit of permits) {
      const { location, ...permitWithoutLocation } = permit;
      const existing = stationMap.get(permit.station_id);
      if (existing) {
        existing.permits.push(permitWithoutLocation);
      } else {
        stationMap.set(permit.station_id, {
          station_id: permit.station_id,
          operator: permit.operator ?? null,
          location: location ?? null,
          permits: [permitWithoutLocation],
        });
      }
    }

    const data = stationIds.map((id) => stationMap.get(id)!).filter(Boolean);
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
  config: { permissions: ["read:uke_permits"], allowGuestAccess: false },
  schema: schemaRoute,
  handler,
};

export default getUnassignedUkePermits;
