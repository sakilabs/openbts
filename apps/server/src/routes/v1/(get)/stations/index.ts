import { createSelectSchema } from "drizzle-orm/zod";
import { sql, count, and } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import { locations, stations, cells, bands, operators, regions, networksIds, lteCells, nrCells } from "@openbts/drizzle";

const stationsSchema = createSelectSchema(stations).omit({ status: true, operator_id: true, location_id: true });
const cellsSchema = createSelectSchema(cells).omit({ band_id: true, station_id: true });
const bandsSchema = createSelectSchema(bands);
const regionSchema = createSelectSchema(regions);
const locationSchema = createSelectSchema(locations).omit({ point: true, region_id: true });
const operatorSchema = createSelectSchema(operators);
const networksSchema = createSelectSchema(networksIds).omit({ station_id: true });
const cellResponseSchema = cellsSchema.extend({ band: bandsSchema });
const stationResponseSchema = stationsSchema.extend({
  cells: z.array(cellResponseSchema),
  location: locationSchema.extend({ region: regionSchema }),
  operator: operatorSchema,
  networks: networksSchema.optional(),
});
type Station = z.infer<typeof stationResponseSchema>;
type CellWithBand = z.infer<typeof cellsSchema> & { band: z.infer<typeof bandsSchema> | null };
type StationRaw = z.infer<typeof stationsSchema> & { cells: CellWithBand[]; networks?: z.infer<typeof networksSchema> | null };
const schemaRoute = {
  querystring: z.object({
    bounds: z
      .string()
      .regex(/^-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+$/)
      .optional()
      .transform((val): number[] | undefined => (val ? val.split(",").map(Number) : undefined)),
    limit: z.coerce.number().min(1).max(1000).optional().default(150),
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
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    sortBy: z.enum(["station_id", "updatedAt", "createdAt"]).optional(),
  }),
  response: {
    200: z.object({
      data: z.array(stationResponseSchema),
      totalCount: z.number(),
    }),
  },
};

type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };
type ResponseBody = { data: Station[]; totalCount: number };

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResponseBody>>) {
  const { limit = undefined, page = 1, bounds, rat, operators: operatorMncs, bands: bandValues, regions, sort, sortBy } = req.query;
  const offset = limit ? (page - 1) * limit : undefined;

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
            value: { in: bandValues },
          },
        })
      : [],
    expandedOperatorMncs?.length
      ? db.query.operators.findMany({
          columns: { id: true },
          where: {
            mnc: { in: expandedOperatorMncs },
          },
        })
      : [],
    regions?.length
      ? db.query.regions.findMany({
          columns: { id: true },
          where: {
            code: { in: regions },
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

  const buildStationConditions = (stationFields: typeof stations): ReturnType<typeof sql>[] => {
    const conditions: ReturnType<typeof sql>[] = [];

    if (operatorIds.length) {
      conditions.push(
        sql`${stationFields.operator_id} = ANY(ARRAY[${sql.join(
          operatorIds.map((id) => sql`${id}`),
          sql`,`,
        )}]::int4[])`,
      );
    }
    if (envelope)
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${locations} WHERE ${locations.id} = ${stationFields.location_id} AND ST_Intersects(${locations.point}, ${envelope}))`,
      );
    if (regionIds.length) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${locations} WHERE ${locations.id} = ${stationFields.location_id} AND ${locations.region_id} = ANY(ARRAY[${sql.join(
          regionIds.map((id) => sql`${id}`),
          sql`,`,
        )}]::int4[]))`,
      );
    }
    if (bandIds.length || nonIotRats.length || iotRequested) {
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
        ? sql`AND (
						EXISTS (SELECT 1 FROM ${lteCells} WHERE ${lteCells.cell_id} = ${cells.id} AND ${lteCells.supports_nb_iot} = true)
						OR EXISTS (SELECT 1 FROM ${nrCells} WHERE ${nrCells.cell_id} = ${cells.id} AND ${nrCells.supports_nr_redcap} = true)
					)`
        : sql``;

      conditions.push(sql`
				EXISTS (
					SELECT 1
					FROM ${cells}
					WHERE ${cells.station_id} = ${stationFields.id}
					${bandCond}
					${ratCond}
					${iotCond}
				)
			`);
    }

    return conditions;
  };

  try {
    const countWhereClause = buildStationConditions(stations);
    const countWhere = countWhereClause.length ? and(...countWhereClause) : undefined;

    const [countResult, btsStations] = await Promise.all([
      db.select({ count: count() }).from(stations).where(countWhere),
      db.query.stations.findMany({
        columns: {
          status: false,
          operator_id: false,
          location_id: false,
        },
        with: {
          cells: {
            columns: { band_id: false },
            with: { band: true },
          },
          location: { columns: { point: false, region_id: false }, with: { region: true } },
          operator: true,
          networks: { columns: { station_id: false } },
        },
        where: {
          RAW: (fields) => {
            const conds = buildStationConditions(fields);
            return and(...conds) ?? sql`true`;
          },
        },
        limit,
        offset,
        orderBy: { [sortBy ?? "id"]: sort ?? "desc" },
      }),
    ]);

    const totalCount = countResult[0]?.count ?? 0;

    const mappedStations: Station[] = btsStations.map((station: StationRaw) => {
      const cellsWithoutDetails = station.cells.map((cell) => {
        const { band, ...rest } = cell;
        return { ...rest, band };
      });

      const stationWithNetworks = { ...station, cells: cellsWithoutDetails } as Station & { networks?: z.infer<typeof networksSchema> | null };
      if (!stationWithNetworks.networks) delete (stationWithNetworks as { networks?: unknown }).networks;
      return stationWithNetworks as Station;
    });

    return res.send({ data: mappedStations, totalCount });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("INTERNAL_SERVER_ERROR", { cause: error });
  }
}

const getStations: Route<ReqQuery, ResponseBody> = {
  url: "/stations",
  method: "GET",
  schema: schemaRoute,
  config: { permissions: ["read:stations"], allowGuestAccess: true },
  handler,
};

export default getStations;
