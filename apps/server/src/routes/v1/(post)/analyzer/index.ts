import { createHash } from "node:crypto";
import { createSelectSchema } from "drizzle-orm/zod";
import { stations, operators, locations, regions } from "@openbts/drizzle";
import { z } from "zod/v4";

import redis from "../../../../database/redis.js";
import db from "../../../../database/psql.js";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import { groupCellsByMnc, pairKey, type CellInput, type AnalyzerResult, type LookupMaps } from "./logic.js";
import { analyzerPool } from "./pool.js";

const MAX_CELLS = 15_000;
const BATCH_SIZE = 200;
const CACHE_TTL_S = 5 * 60;

const dateTime = z.union([z.date().transform((d) => d.toISOString()), z.iso.datetime()]);

const stationSchema = createSelectSchema(stations)
  .omit({ operator_id: true, location_id: true, status: true })
  .extend({ updatedAt: dateTime, createdAt: dateTime });
const locationSchema = createSelectSchema(locations).omit({ point: true, region_id: true }).extend({ updatedAt: dateTime, createdAt: dateTime });
const regionSchema = createSelectSchema(regions);
const operatorSchema = createSelectSchema(operators);

const analyzerStationSchema = stationSchema.extend({
  operator: operatorSchema,
  location: locationSchema.extend({ region: regionSchema }),
});
type AnalyzerStation = z.infer<typeof analyzerStationSchema>;

const cellInputSchema = z.union([
  z.object({ rat: z.literal("GSM"), mnc: z.number().int(), lac: z.number().int(), cid: z.number().int() }),
  z.object({ rat: z.literal("UMTS"), mnc: z.number().int(), lac: z.number().int(), cid: z.number().int(), rnc: z.number().int() }),
  z.object({
    rat: z.literal("LTE"),
    mnc: z.number().int(),
    tac: z.number().int(),
    enbid: z.number().int(),
    clid: z.number().int(),
    pci: z.number().int(),
  }),
  z.object({ rat: z.literal("NR"), mnc: z.number().int() }),
]);

const matchedCellSchema = z.union([
  z.object({ rat: z.literal("GSM"), lac: z.number(), cid: z.number() }),
  z.object({ rat: z.literal("UMTS"), rnc: z.number(), cid: z.number(), lac: z.number().nullable() }),
  z.object({ rat: z.literal("LTE"), enbid: z.number(), clid: z.number().nullable(), tac: z.number().nullable(), pci: z.number().nullable() }),
  z.object({ rat: z.literal("NR") }),
]);

type ReqBody = { Body: { cells: CellInput[] } };

const schemaRoute = {
  body: z.object({ cells: z.array(cellInputSchema).min(1).max(MAX_CELLS) }),
  response: {
    200: z.object({
      data: z.array(
        z.object({
          status: z.enum(["found", "probable", "not_found", "unsupported"]),
          station: analyzerStationSchema.optional(),
          cell: matchedCellSchema.optional(),
          warnings: z.array(z.string()),
        }),
      ),
    }),
  },
};

const STATION_WITH = {
  operator: true,
  location: { columns: { point: false, region_id: false }, with: { region: true } },
} as const;

const STATION_COLS = { operator_id: false, location_id: false } as const;
const CELL_COLS = { band_id: false, station_id: false } as const;

async function executeLookups(groups: ReturnType<typeof groupCellsByMnc>): Promise<LookupMaps<AnalyzerStation>> {
  const gsmMap = new Map<string, { station: AnalyzerStation; lac: number; cid: number }>();
  const umtsRncMap = new Map<string, { station: AnalyzerStation; rnc: number; cid: number; lac: number | null }>();
  const umtsLacMap = new Map<string, { station: AnalyzerStation; rnc: number; cid: number; lac: number | null }>();
  const lteMap = new Map<string, { station: AnalyzerStation; enbid: number; clid: number; tac: number | null; pci: number | null }>();
  const lteEnbidMap = new Map<string, { station: AnalyzerStation; enbid: number }>();

  const promises: Promise<void>[] = [];

  for (const [mnc, pairMap] of groups.gsmByMnc) {
    for (let i = 0, pairs = [...pairMap.values()]; i < pairs.length; i += BATCH_SIZE) {
      const chunk = pairs.slice(i, i + BATCH_SIZE);
      promises.push(
        db.query.gsmCells
          .findMany({
            columns: { cell_id: false },
            where: { cell: { station: { operator: { mnc } } }, OR: chunk.map(([lac, cid]) => ({ lac, cid })) },
            with: { cell: { columns: CELL_COLS, with: { station: { columns: STATION_COLS, with: STATION_WITH } } } },
          })
          .then((rows) => {
            for (const row of rows)
              gsmMap.set(pairKey(mnc, row.lac, row.cid), { station: row.cell.station as unknown as AnalyzerStation, lac: row.lac, cid: row.cid });
          }),
      );
    }
  }

  for (const [mnc, pairMap] of groups.umtsRncByMnc) {
    for (let i = 0, pairs = [...pairMap.values()]; i < pairs.length; i += BATCH_SIZE) {
      const chunk = pairs.slice(i, i + BATCH_SIZE);
      promises.push(
        db.query.umtsCells
          .findMany({
            columns: { cell_id: false },
            where: { cell: { station: { operator: { mnc } } }, OR: chunk.map(([rnc, cid]) => ({ rnc, cid })) },
            with: { cell: { columns: CELL_COLS, with: { station: { columns: STATION_COLS, with: STATION_WITH } } } },
          })
          .then((rows) => {
            for (const row of rows)
              umtsRncMap.set(pairKey(mnc, row.rnc, row.cid), {
                station: row.cell.station as unknown as AnalyzerStation,
                rnc: row.rnc,
                cid: row.cid,
                lac: row.lac ?? null,
              });
          }),
      );
    }
  }

  for (const [mnc, pairMap] of groups.umtsLacByMnc) {
    for (let i = 0, pairs = [...pairMap.values()]; i < pairs.length; i += BATCH_SIZE) {
      const chunk = pairs.slice(i, i + BATCH_SIZE);
      promises.push(
        db.query.umtsCells
          .findMany({
            columns: { cell_id: false },
            where: { cell: { station: { operator: { mnc } } }, OR: chunk.map(([lac, cid]) => ({ lac, cid })) },
            with: { cell: { columns: CELL_COLS, with: { station: { columns: STATION_COLS, with: STATION_WITH } } } },
          })
          .then((rows) => {
            for (const row of rows) {
              if (row.lac !== null)
                umtsLacMap.set(pairKey(mnc, row.lac, row.cid), {
                  station: row.cell.station as unknown as AnalyzerStation,
                  rnc: row.rnc,
                  cid: row.cid,
                  lac: row.lac,
                });
            }
          }),
      );
    }
  }

  for (const [mnc, pairMap] of groups.lteByMnc) {
    for (let i = 0, pairs = [...pairMap.values()]; i < pairs.length; i += BATCH_SIZE) {
      const chunk = pairs.slice(i, i + BATCH_SIZE);
      promises.push(
        db.query.lteCells
          .findMany({
            columns: { cell_id: false },
            where: { cell: { station: { operator: { mnc } } }, OR: chunk.map(([enbid, clid]) => ({ enbid, clid })) },
            with: { cell: { columns: CELL_COLS, with: { station: { columns: STATION_COLS, with: STATION_WITH } } } },
          })
          .then((rows) => {
            for (const row of rows)
              lteMap.set(pairKey(mnc, row.enbid, row.clid), {
                station: row.cell.station as unknown as AnalyzerStation,
                enbid: row.enbid,
                clid: row.clid,
                tac: row.tac ?? null,
                pci: row.pci ?? null,
              });
          }),
      );
    }
  }

  for (const [mnc, enbidSet] of groups.lteEnbidsByMnc) {
    for (let i = 0, enbids = [...enbidSet]; i < enbids.length; i += BATCH_SIZE) {
      const chunk = enbids.slice(i, i + BATCH_SIZE);
      promises.push(
        db.query.lteCells
          .findMany({
            columns: { cell_id: false },
            where: { cell: { station: { operator: { mnc } } }, OR: chunk.map((enbid) => ({ enbid })) },
            with: { cell: { columns: CELL_COLS, with: { station: { columns: STATION_COLS, with: STATION_WITH } } } },
          })
          .then((rows) => {
            for (const row of rows) {
              const key = `${mnc}:${row.enbid}`;
              if (!lteEnbidMap.has(key)) lteEnbidMap.set(key, { station: row.cell.station as unknown as AnalyzerStation, enbid: row.enbid });
            }
          }),
      );
    }
  }

  await Promise.all(promises);
  return { gsmMap, umtsRncMap, umtsLacMap, lteMap, lteEnbidMap };
}

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<AnalyzerResult<AnalyzerStation>[]>>) {
  const { cells: inputCells } = req.body;

  const key = `analyzer:${createHash("sha256").update(JSON.stringify(inputCells)).digest("hex")}`;
  const cached = await redis.get(key);
  if (cached) return res.send({ data: JSON.parse(cached) });

  const groups = groupCellsByMnc(inputCells);
  const maps = await executeLookups(groups);

  const json = await analyzerPool.run(inputCells, maps);
  await redis.set(key, json, { EX: CACHE_TTL_S });

  return res.send({ data: JSON.parse(json) });
}

const analyzerRoute: Route<ReqBody, AnalyzerResult<AnalyzerStation>[]> = {
  url: "/analyzer",
  method: "POST",
  schema: schemaRoute,
  handler,
};

export default analyzerRoute;
