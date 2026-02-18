import { createSelectSchema } from "drizzle-orm/zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { locations, regions, stations, cells, bands, operators, networksIds } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const locationsSchema = createSelectSchema(locations).omit({ point: true, region_id: true });
const regionsSchema = createSelectSchema(regions);
const stationsSchema = createSelectSchema(stations).omit({ status: true, operator_id: true, location_id: true });
const cellsSchema = createSelectSchema(cells).omit({ band_id: true, station_id: true });
const bandsSchema = createSelectSchema(bands);
const operatorSchema = createSelectSchema(operators);
const networksSchema = createSelectSchema(networksIds).omit({ station_id: true });
const cellResponseSchema = cellsSchema.extend({ band: bandsSchema });
const stationResponseSchema = stationsSchema.extend({
  cells: z.array(cellResponseSchema),
  operator: operatorSchema,
  networks: networksSchema.optional(),
});

const schemaRoute = {
  params: z.object({
    id: z.coerce.number<number>(),
  }),
  querystring: z.object({
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
  }),
  response: {
    200: z.object({
      data: locationsSchema.extend({
        region: regionsSchema,
        stations: z.array(stationResponseSchema),
      }),
    }),
  },
};

type ReqParams = { Params: { id: number }; Querystring: z.infer<typeof schemaRoute.querystring> };
type StationData = z.infer<typeof stationResponseSchema>;
type ResponseData = z.infer<typeof locationsSchema> & { region: z.infer<typeof regionsSchema>; stations: StationData[] };

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const { id } = req.params;
  const { rat, operators: operatorMncs, bands: bandValues } = req.query;

  const expandedOperatorMncs = operatorMncs?.includes(26034) ? [...new Set([...operatorMncs, 26002, 26003])] : operatorMncs;

  const [bandRows, operatorRows] = await Promise.all([
    bandValues?.length
      ? db.query.bands.findMany({
          columns: { id: true },
          where: {
            RAW: (fields, { inArray }) => inArray(fields.value, bandValues),
          },
        })
      : [],
    expandedOperatorMncs?.length
      ? db.query.operators.findMany({
          columns: { id: true },
          where: {
            RAW: (fields, { inArray }) => inArray(fields.mnc, expandedOperatorMncs),
          },
        })
      : [],
  ]);

  const bandIds = bandRows.map((b) => b.id);
  const operatorIds = operatorRows.map((r) => r.id);

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
          EXISTS (SELECT 1 FROM lte_cells lc WHERE lc.cell_id = ${cells.id} AND lc.supports_nb_iot = true)
          OR EXISTS (SELECT 1 FROM nr_cells nc WHERE nc.cell_id = ${cells.id} AND nc.supports_nr_redcap = true)
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

  const location = await db.query.locations.findFirst({
    where: {
      id: id,
    },
    columns: {
      point: false,
      region_id: false,
    },
    with: {
      region: true,
      stations: {
        columns: { status: false, location_id: false, operator_id: false },
        where: hasStationFilters ? { RAW: (fields) => buildStationFilter(fields) ?? sql`true` } : undefined,
        with: {
          cells: {
            columns: { band_id: false, station_id: false },
            with: { band: true },
          },
          operator: true,
          networks: { columns: { station_id: false } },
        },
      },
    },
  });

  if (!location) throw new ErrorResponse("NOT_FOUND");

  const cleanedStations = location.stations.map((station) => {
    const stationData = { ...station } as StationData & { networks?: unknown | null };
    if (!stationData.networks) delete stationData.networks;
    return stationData as StationData;
  });

  return res.send({ data: { ...location, stations: cleanedStations } });
}

const getLocation: Route<ReqParams, ResponseData> = {
  url: "/locations/:id",
  method: "GET",
  config: { permissions: ["read:locations"], allowGuestAccess: true },
  schema: schemaRoute,
  handler,
};

export default getLocation;
