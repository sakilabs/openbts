import { createSelectSchema } from "drizzle-zod";
import { sql, count, and } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { locations, regions, stations, operators, cells, lteCells, nrCells } from "@openbts/drizzle";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const locationsSchema = createSelectSchema(locations).omit({ point: true, region_id: true });
const regionsSchema = createSelectSchema(regions);
const stationsSchema = createSelectSchema(stations).omit({ status: true, location_id: true });
const operatorSchema = createSelectSchema(operators);
const stationResponseSchema = stationsSchema.extend({
  operator: operatorSchema.nullable(),
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
      .regex(/^(?:cdma|umts|gsm|lte|5g|iot)(?:,(?:cdma|umts|gsm|lte|5g|iot))*$/i)
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
    orphaned: z.coerce.boolean().optional().default(false),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    sortBy: z.enum(["id", "updatedAt", "createdAt"]).optional(),
  }),
  response: {
    200: z.object({
      data: z.array(
        locationsSchema.extend({
          region: regionsSchema,
          stations: z.array(stationResponseSchema),
        }),
      ),
      totalCount: z.number(),
    }),
  },
};
type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };
type StationData = z.infer<typeof stationResponseSchema>;
type ResponseData = z.infer<typeof locationsSchema> & { region: z.infer<typeof regionsSchema>; stations: StationData[] };
type ResponseBody = { data: ResponseData[]; totalCount: number };

const ORPHANED_ALLOWED_ROLES = new Set(["admin", "editor", "moderator"]);

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResponseBody>>) {
  const {
    bounds,
    limit,
    page,
    rat,
    operators: operatorMncs,
    bands: bandValues,
    regions: regionNames,
    new: recentDays,
    orphaned,
    sort,
    sortBy,
  } = req.query;
  const offset = (page - 1) * limit;

  const userRole = req.userSession?.user?.role as string | undefined;
  const showOrphaned = orphaned && userRole !== undefined && ORPHANED_ALLOWED_ROLES.has(userRole);

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
          where: {
            value: {
              in: bandValues,
            },
          },
        })
      : [],
    expandedOperatorMncs?.length
      ? db.query.operators.findMany({
          columns: { id: true },
          where: {
            mnc: {
              in: expandedOperatorMncs,
            },
          },
        })
      : [],
    regionNames?.length
      ? db.query.regions.findMany({
          columns: { id: true },
          where: {
            name: {
              in: regionNames,
            },
          },
        })
      : [],
  ]);

  const bandIds = bandRows.map((b) => b.id);
  const operatorIds = operatorRows.map((r) => r.id);
  const regionIds = regionsRows.map((r) => r.id);

  if (bandValues?.length && !bandIds.length) return res.send({ data: [], totalCount: 0 });

  const requestedRats = rat ?? [];
  type NonIotRat = "GSM" | "UMTS" | "LTE" | "NR";
  const ratMap: Record<string, NonIotRat> = { gsm: "GSM", umts: "UMTS", lte: "LTE", "5g": "NR" } as const;
  const nonIotRats: NonIotRat[] = requestedRats.map((r) => ratMap[r]).filter((r): r is NonIotRat => r !== undefined);
  const iotRequested = requestedRats.includes("iot");

  const hasStationFilters = operatorIds.length || bandIds.length || nonIotRats.length || iotRequested;

  const buildStationFilter = (stationFields: typeof stations) => {
    if (!hasStationFilters) return undefined;
    const conditions: ReturnType<typeof sql>[] = [];

    if (operatorIds.length) {
      conditions.push(
        sql`${stationFields.operator_id} = ANY(ARRAY[${sql.join(
          operatorIds.map((id) => sql`${id}`),
          sql`,`,
        )}]::int4[])`,
      );
    }

    if (bandIds.length || nonIotRats.length || iotRequested) {
      const cellConditions: ReturnType<typeof sql>[] = [];

      if (bandIds.length) {
        cellConditions.push(
          sql`${cells.band_id} = ANY(ARRAY[${sql.join(
            bandIds.map((id) => sql`${id}`),
            sql`,`,
          )}]::int4[])`,
        );
      }

      if (nonIotRats.length) {
        cellConditions.push(
          sql`${cells.rat} IN (${sql.join(
            nonIotRats.map((r) => sql`${r}`),
            sql`,`,
          )})`,
        );
      }

      if (iotRequested) {
        cellConditions.push(sql`(
					EXISTS (SELECT 1 FROM ${lteCells} WHERE ${lteCells.cell_id} = ${cells.id} AND ${lteCells.supports_nb_iot} = true)
					OR EXISTS (SELECT 1 FROM ${nrCells} WHERE ${nrCells.cell_id} = ${cells.id} AND ${nrCells.supports_nr_redcap} = true)
				)`);
      }

      const cellWhere = cellConditions.length > 1 ? sql`(${sql.join(cellConditions, sql` AND `)})` : cellConditions[0];

      conditions.push(sql`EXISTS (
				SELECT 1 FROM ${cells}
				WHERE ${cells.station_id} = ${stationFields.id}
				AND ${cellWhere}
			)`);
    }

    return conditions.length > 1 ? sql`(${sql.join(conditions, sql` AND `)})` : conditions[0];
  };

  const buildLocationConditions = (locFields: typeof locations) => {
    const conditions: ReturnType<typeof sql>[] = [];

    if (envelope) conditions.push(sql`ST_Intersects(${locFields.point}, ${envelope})`);
    if (regionIds.length) {
      conditions.push(
        sql`${locFields.region_id} = ANY(ARRAY[${sql.join(
          regionIds.map((id) => sql`${id}`),
          sql`,`,
        )}]::int4[])`,
      );
    }
    if (recentDays) {
      const cutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
      conditions.push(sql`(${locFields.createdAt} >= ${cutoff.toISOString()} OR ${locFields.updatedAt} >= ${cutoff.toISOString()})`);
    }
    if (hasStationFilters) {
      const operatorCond = operatorIds.length
        ? sql` AND ${stations.operator_id} = ANY(ARRAY[${sql.join(
            operatorIds.map((id) => sql`${id}`),
            sql`,`,
          )}]::int4[])`
        : sql``;
      const bandCond = bandIds.length
        ? sql` AND ${cells.band_id} = ANY(ARRAY[${sql.join(
            bandIds.map((id) => sql`${id}`),
            sql`,`,
          )}]::int4[])`
        : sql``;
      const ratCond = nonIotRats.length
        ? sql` AND ${cells.rat} IN (${sql.join(
            nonIotRats.map((r) => sql`${r}`),
            sql`,`,
          )})`
        : sql``;
      const iotCond = iotRequested
        ? sql` AND (
						EXISTS (SELECT 1 FROM ${lteCells} WHERE ${lteCells.cell_id} = ${cells.id} AND ${lteCells.supports_nb_iot} = true)
						OR EXISTS (SELECT 1 FROM ${nrCells} WHERE ${nrCells.cell_id} = ${cells.id} AND ${nrCells.supports_nr_redcap} = true)
					)`
        : sql``;

      if (bandIds.length || nonIotRats.length || iotRequested) {
        conditions.push(sql`
					EXISTS (
						SELECT 1
						FROM ${stations}
						JOIN ${cells} ON ${cells.station_id} = ${stations.id}
						WHERE ${stations.location_id} = ${locFields.id}
						${operatorCond}
						${bandCond}
						${ratCond}
						${iotCond}
					)
				`);
      } else {
        conditions.push(sql`
					EXISTS (
						SELECT 1
						FROM ${stations}
						WHERE ${stations.location_id} = ${locFields.id}
						${operatorCond}
					)
				`);
      }
    } else if (!showOrphaned) {
      conditions.push(sql`
				EXISTS (
					SELECT 1
					FROM ${stations}
					WHERE ${stations.location_id} = ${locFields.id}
				)
			`);
    }

    return conditions;
  };

  try {
    const countConditions = buildLocationConditions(locations);
    const countWhereClause = countConditions.length ? and(...countConditions) : undefined;

    const [countResult, locationRows] = await Promise.all([
      db.select({ count: count() }).from(locations).where(countWhereClause),
      db.query.locations.findMany({
        with: {
          region: true,
          stations: {
            columns: { status: false, location_id: false },
            where: hasStationFilters ? { RAW: (fields) => buildStationFilter(fields) ?? sql`true` } : undefined,
            with: {
              operator: true,
            },
          },
        },
        columns: {
          point: false,
          region_id: false,
        },
        where: {
          RAW: (fields) => {
            const conds = buildLocationConditions(fields);
            return and(...conds) ?? sql`true`;
          },
        },
        limit,
        offset,
        orderBy: { [sortBy ?? "id"]: sort ?? "desc" },
      }),
    ]);

    const totalCount = countResult[0]?.count ?? 0;

    return res.send({ data: locationRows, totalCount });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("INTERNAL_SERVER_ERROR", { cause: error });
  }
}

const getLocations: Route<ReqQuery, ResponseBody> = {
  url: "/locations",
  method: "GET",
  config: { permissions: ["read:locations"], allowGuestAccess: true },
  schema: schemaRoute,
  handler,
};

export default getLocations;
