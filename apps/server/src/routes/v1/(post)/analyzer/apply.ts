import { cells, gsmCells, lteCells, nrCells, stations, umtsCells } from "@openbts/drizzle";
import db from "@openbts/drizzle/db";
import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import type { FastifyRequest } from "fastify";
import z from "zod";

import { ErrorResponse } from "../../../../errors.ts";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.ts";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.ts";
import { createAuditLog } from "../../../../services/auditLog.service.ts";
import { checkCellDuplicatesBatch, checkLTEPCIDuplicate, checkNRPCIDuplicate } from "../../../../services/cellDuplicateCheck.service.ts";
import { computeGnbidLength, makeDetailsRatRefine } from "../../../../utils/submission.helpers.ts";

const lteCellsSchema = createSelectSchema(lteCells);
const nrCellsSchema = createSelectSchema(nrCells);
const gsmInsertSchema = createInsertSchema(gsmCells)
  .omit({ cell_id: true, createdAt: true, updatedAt: true })
  .extend({ lac: z.number().int().min(0).max(65535), cid: z.number().int().min(0).max(65535) })
  .strict();
const umtsInsertSchema = createInsertSchema(umtsCells)
  .omit({ cell_id: true, createdAt: true, updatedAt: true })
  .extend({
    lac: z.number().int().min(0).max(65535).nullable().optional(),
    rnc: z.number().int().min(0).max(65535),
    cid: z.number().int().min(0).max(65535),
    arfcn: z.number().int().min(0).max(16383).nullable().optional(),
  })
  .strict();
const lteInsertSchema = createInsertSchema(lteCells)
  .omit({ cell_id: true, createdAt: true, updatedAt: true })
  .extend({
    tac: z.number().int().min(0).max(65535),
    enbid: z.number().int().min(0).max(1048575),
    clid: z.number().int().min(0).max(255),
    pci: z.number().int().min(0).max(503).nullable().optional(),
    earfcn: z.number().int().min(0).max(262143).nullable().optional(),
  })
  .strict();
const nrInsertSchema = createInsertSchema(nrCells)
  .omit({ cell_id: true, createdAt: true, updatedAt: true })
  .extend({
    nrtac: z.number().int().min(0).max(16777215).nullable().optional(),
    gnbid: z.number().int().min(0).max(4294967295).nullable().optional(),
    clid: z.number().int().min(0).max(16383).nullable().optional(),
    pci: z.number().int().min(0).max(1007).nullable().optional(),
    arfcn: z.number().int().min(0).max(3279165).nullable().optional(),
  })
  .strict();

const gsmUpdateSchema = createUpdateSchema(gsmCells)
  .omit({ createdAt: true, updatedAt: true })
  .extend({ lac: z.number().int().min(0).max(65535).optional(), cid: z.number().int().min(0).max(65535).optional() })
  .strict();
const umtsUpdateSchema = createUpdateSchema(umtsCells)
  .omit({ createdAt: true, updatedAt: true })
  .extend({
    lac: z.number().int().min(0).max(65535).nullable().optional(),
    rnc: z.number().int().min(0).max(65535).optional(),
    cid: z.number().int().min(0).max(65535).optional(),
    arfcn: z.number().int().min(0).max(16383).nullable().optional(),
  })
  .strict();
const lteUpdateSchema = createUpdateSchema(lteCells)
  .omit({ createdAt: true, updatedAt: true })
  .extend({
    tac: z.number().int().min(0).max(65535).nullable().optional(),
    enbid: z.number().int().min(0).max(1048575).optional(),
    clid: z.number().int().min(0).max(255).optional(),
    pci: z.number().int().min(0).max(503).nullable().optional(),
    earfcn: z.number().int().min(0).max(262143).nullable().optional(),
  })
  .strict();
const nrUpdateSchema = createUpdateSchema(nrCells)
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    nrtac: z.number().int().min(0).max(16777215).nullable().optional(),
    gnbid: z.number().int().min(0).max(4294967295).nullable().optional(),
    clid: z.number().int().min(0).max(16383).nullable().optional(),
    pci: z.number().int().min(0).max(1007).nullable().optional(),
    arfcn: z.number().int().min(0).max(3279165).nullable().optional(),
  })
  .strict();

const ITEMS_CAP = 25;
const cellSchema = z.discriminatedUnion("operation", [
  z
    .object({
      operation: z.literal("add"),
      target_cell_id: z.number().optional(),
      band_id: z.number(),
      rat: z.enum(["GSM", "UMTS", "LTE", "NR"]),
      details: z.unknown().optional(),
    })
    .superRefine(makeDetailsRatRefine({ GSM: gsmInsertSchema, UMTS: umtsInsertSchema, LTE: lteInsertSchema, NR: nrInsertSchema })),
  z
    .object({
      operation: z.literal("update"),
      target_cell_id: z.number().optional(),
      band_id: z.number(),
      rat: z.enum(["GSM", "UMTS", "LTE", "NR"]),
      details: z.unknown().optional(),
    })
    .superRefine(makeDetailsRatRefine({ GSM: gsmUpdateSchema, UMTS: umtsUpdateSchema, LTE: lteUpdateSchema, NR: nrUpdateSchema })),
]);

const requestSchema = z.object({
  items: z
    .array(
      z.object({
        station_id: z.number(),
        cells: z.array(cellSchema).min(1),
      }),
    )
    .min(1)
    .max(ITEMS_CAP),
});

const responseSchema = z.object({
  data: z.array(
    z.object({
      station_id: z.number(),
      applied: z.number(),
    }),
  ),
});

type GSMUpdateDetails = z.infer<typeof gsmUpdateSchema>;
type UMTSUpdateDetails = z.infer<typeof umtsUpdateSchema>;
type LTEUpdateDetails = z.infer<typeof lteUpdateSchema>;
type NRUpdateDetails = z.infer<typeof nrUpdateSchema>;
type GSMInsertDetails = z.infer<typeof gsmInsertSchema>;
type UMTSInsertDetails = z.infer<typeof umtsInsertSchema>;
type LTEInsertDetails = z.infer<typeof lteInsertSchema>;
type NRInsertDetails = z.infer<typeof nrInsertSchema>;
type RATInsertDetails = GSMInsertDetails | UMTSInsertDetails | LTEInsertDetails | NRInsertDetails;
type RATUpdateDetails = GSMUpdateDetails | UMTSUpdateDetails | LTEUpdateDetails | NRUpdateDetails;

type ReqBody = { Body: z.infer<typeof requestSchema> };
type ResponseData = z.infer<typeof responseSchema.shape.data>;

const schemaRoute = {
  body: requestSchema,
  response: { 200: responseSchema },
};

type StationChangeRecord = {
  station_id: number;
  old_updatedAt: Date | null;
  new_updatedAt: Date | null | undefined;
  updatedCellIds: number[];
  addedCellIds: number[];
  applied: number;
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const userId = req.userSession?.user.id;
  if (!userId) throw new ErrorResponse("UNAUTHORIZED");
  const { items } = req.body;

  const stationIds = items.map((item) => item.station_id);
  const stationResults = await db.query.stations.findMany({
    where: { AND: [{ id: { in: stationIds } }, { status: "published" }] },
  });
  if (!stationResults) throw new ErrorResponse("NOT_FOUND", { message: "None of the stations in this batch were found in the database" });

  const stationMap = new Map(stationResults.map((station) => [station.id, station]));

  const stationItems = items.map((item) => ({ item, station: stationMap.get(item.station_id)! }));

  const updateCellIds = items.flatMap((item) =>
    item.cells.filter((cell) => cell.operation === "update" && cell.target_cell_id !== undefined).map((cell) => cell.target_cell_id!),
  );

  const existingCells =
    updateCellIds.length > 0
      ? await db.query.cells.findMany({
          where: { id: { in: updateCellIds } },
          with: { gsm: true, umts: true, lte: true, nr: true },
        })
      : [];

  for (const { item, station } of stationItems) {
    for (const cell of item.cells) {
      if (cell.operation !== "update" || cell.target_cell_id === undefined) continue;
      const existingCell = existingCells.find((existingCell) => existingCell.id === cell.target_cell_id);
      if (!existingCell || existingCell.station_id !== station.id)
        throw new ErrorResponse("NOT_FOUND", { message: `Cell ${cell.target_cell_id} does not exist on station ${station.id}` });
    }

    if (station.operator_id) {
      const cellEntries = item.cells.map((cell) => ({
        rat: cell.rat,
        details: cell.details! as RATInsertDetails,
        excludeCellId: cell.operation === "update" ? cell.target_cell_id : undefined,
      }));
      // oxlint-disable-next-line no-await-in-loop
      await checkCellDuplicatesBatch(cellEntries, station.operator_id);
    }

    for (const cell of item.cells) {
      const excludeId = cell.operation === "update" ? cell.target_cell_id : undefined;
      if (cell.rat === "LTE") {
        const details = cell.details as z.infer<typeof lteCellsSchema>;
        if (details.pci !== null && details.pci !== undefined)
          // oxlint-disable-next-line no-await-in-loop
          await checkLTEPCIDuplicate(station.id, cell.band_id, details.pci, details.earfcn, excludeId);
      } else if (cell.rat === "NR") {
        const details = cell.details as z.infer<typeof nrCellsSchema>;
        if (details.pci !== null && details.pci !== undefined)
          // oxlint-disable-next-line no-await-in-loop
          await checkNRPCIDuplicate(station.id, cell.band_id, details.pci, details.arfcn, excludeId);
      }
    }
  }

  const updateRecords = await db.transaction(async (tx) => {
    async function updateRATDetails(rat: "GSM" | "UMTS" | "LTE" | "NR", cellId: number, cellDetails: RATUpdateDetails) {
      switch (rat) {
        case "GSM":
          {
            const details = cellDetails as GSMUpdateDetails;
            await tx
              .update(gsmCells)
              .set({ ...details, updatedAt: new Date() })
              .where(eq(gsmCells.cell_id, cellId));
          }
          break;
        case "UMTS":
          {
            const details = cellDetails as UMTSUpdateDetails;
            await tx
              .update(umtsCells)
              .set({ ...details, updatedAt: new Date() })
              .where(eq(umtsCells.cell_id, cellId));
          }
          break;
        case "LTE":
          {
            const details = cellDetails as LTEUpdateDetails;
            await tx
              .update(lteCells)
              .set({ ...details, updatedAt: new Date() })
              .where(eq(lteCells.cell_id, cellId));
          }
          break;
        case "NR":
          {
            const details = cellDetails as NRUpdateDetails;
            await tx
              .update(nrCells)
              .set({ ...details, updatedAt: new Date() })
              .where(eq(nrCells.cell_id, cellId));
          }
          break;
      }
    }

    async function insertRATDetails(rat: "GSM" | "UMTS" | "LTE" | "NR", cellId: number, cellDetails: RATInsertDetails) {
      switch (rat) {
        case "GSM":
          {
            const details = cellDetails as GSMInsertDetails;
            await tx.insert(gsmCells).values({ cell_id: cellId, lac: details.lac, cid: details.cid, e_gsm: details.e_gsm });
          }
          break;
        case "UMTS":
          {
            const details = cellDetails as UMTSInsertDetails;
            await tx.insert(umtsCells).values({
              cell_id: cellId,
              lac: details.lac,
              rnc: details.rnc,
              cid: details.cid,
              arfcn: details.arfcn,
            });
          }
          break;
        case "LTE":
          {
            const details = cellDetails as LTEInsertDetails;
            await tx.insert(lteCells).values({
              cell_id: cellId,
              tac: details.tac,
              enbid: details.enbid,
              clid: details.clid,
              pci: details.pci,
              earfcn: details.earfcn,
              supports_iot: details.supports_iot,
            });
          }
          break;
        case "NR":
          {
            const details = cellDetails as NRInsertDetails;
            await tx.insert(nrCells).values({
              cell_id: cellId,
              type: details.type,
              nrtac: details.nrtac,
              gnbid: details.gnbid,
              gnbid_length: computeGnbidLength(details.gnbid),
              clid: details.clid,
              pci: details.pci,
              arfcn: details.arfcn,
              supports_nr_redcap: details.supports_nr_redcap,
            });
          }
          break;
      }
    }

    const records: StationChangeRecord[] = [];

    for (const { item, station } of stationItems) {
      const updatedCellIds: number[] = [];
      const addedCellIds: number[] = [];

      for (const cell of item.cells) {
        if (cell.operation === "update" && cell.target_cell_id !== undefined) {
          // oxlint-disable-next-line no-await-in-loop
          await tx.update(cells).set({ band_id: cell.band_id, updatedAt: new Date() }).where(eq(cells.id, cell.target_cell_id));
          // oxlint-disable-next-line no-await-in-loop
          await updateRATDetails(cell.rat, cell.target_cell_id, cell.details as RATUpdateDetails);
          updatedCellIds.push(cell.target_cell_id);
        } else if (cell.operation === "add") {
          // oxlint-disable-next-line no-await-in-loop
          const [newCell] = await tx
            .insert(cells)
            .values({ station_id: station.id, band_id: cell.band_id, rat: cell.rat, is_confirmed: true })
            .returning();
          if (newCell) {
            // oxlint-disable-next-line no-await-in-loop
            await insertRATDetails(cell.rat, newCell.id, cell.details as RATInsertDetails);
            addedCellIds.push(newCell.id);
          }
        }
      }

      // oxlint-disable-next-line no-await-in-loop
      const [updatedStation] = await tx.update(stations).set({ updatedAt: new Date() }).where(eq(stations.id, station.id)).returning();

      records.push({
        station_id: station.id,
        old_updatedAt: station.updatedAt,
        new_updatedAt: updatedStation?.updatedAt,
        updatedCellIds,
        addedCellIds,
        applied: updatedCellIds.length + addedCellIds.length,
      });
    }

    return records;
  });

  const touchedCellIds = updateRecords.flatMap((record) => [...record.updatedCellIds, ...record.addedCellIds]);
  const newCellStates =
    touchedCellIds.length > 0
      ? await db.query.cells.findMany({
          where: { id: { in: touchedCellIds } },
          with: { gsm: true, umts: true, lte: true, nr: true },
        })
      : [];
  function flattenCellDetails(cell: (typeof newCellStates)[0]) {
    const { gsm, umts, lte, nr, ...base } = cell;
    return { ...base, details: gsm ?? umts ?? lte ?? nr ?? null };
  }

  await Promise.all(
    updateRecords.map(async (record) => {
      const cellsUpdated = record.updatedCellIds.map((id) => ({
        old: flattenCellDetails(existingCells.find((cell) => cell.id === id)!),
        new: flattenCellDetails(newCellStates.find((cell) => cell.id === id)!),
      }));
      await createAuditLog(
        {
          action: "cells.update",
          table_name: "cells",
          record_id: null,
          old_values: { cells: cellsUpdated.map((c) => c.old) },
          new_values: { cells: cellsUpdated.map((c) => c.new) },
          metadata: { station_id: record.station_id, source: "analyzer" },
        },
        req,
      );

      if (record.addedCellIds.length > 0) {
        const cellsCreated = record.addedCellIds.map((id) => flattenCellDetails(newCellStates.find((cell) => cell.id === id)!));
        await createAuditLog(
          {
            action: "cells.create",
            table_name: "cells",
            record_id: null,
            old_values: null,
            new_values: { cells: cellsCreated },
            metadata: { station_id: record.station_id, source: "analyzer" },
          },
          req,
        );
      }

      await createAuditLog(
        {
          action: "stations.update",
          table_name: "stations",
          record_id: record.station_id,
          old_values: { updatedAt: record.old_updatedAt },
          new_values: { updatedAt: record.new_updatedAt },
          metadata: { reason: "analyzer" },
        },
        req,
      );
    }),
  );

  return res.send({ data: updateRecords.map((record) => ({ station_id: record.station_id, applied: record.applied })) });
}

const applyAnalyzerCells: Route<ReqBody, ResponseData> = {
  url: "/analyzer/apply",
  method: "POST",
  config: { permissions: ["create:cells", "update:cells", "read:cells"] },
  schema: schemaRoute,
  handler,
};

export default applyAnalyzerCells;
