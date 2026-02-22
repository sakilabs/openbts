import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { createAuditLog } from "../../../../../../services/auditLog.service.js";
import { checkGSMDuplicate, checkLTEDuplicate, checkUMTSDuplicate } from "../../../../../../services/cellDuplicateCheck.service.js";
import { cells, gsmCells, umtsCells, lteCells, nrCells, stations } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

const cellsUpdateSchema = createUpdateSchema(cells)
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .strict();
const cellsSelectSchema = createSelectSchema(cells);
const gsmCellsSelectSchema = createSelectSchema(gsmCells).omit({ cell_id: true }).strict();
const umtsCellsSelectSchema = createSelectSchema(umtsCells).omit({ cell_id: true }).strict();
const lteCellsSelectSchema = createSelectSchema(lteCells).omit({ cell_id: true }).strict();
const nrCellsSelectSchema = createSelectSchema(nrCells).omit({ cell_id: true }).strict();
const cellDetailsSchema = z.union([gsmCellsSelectSchema, umtsCellsSelectSchema, lteCellsSelectSchema, nrCellsSelectSchema]).optional();
const gsmCellsUpdateSchema = createUpdateSchema(gsmCells).strict();
const umtsCellsUpdateSchema = createUpdateSchema(umtsCells).strict();
const lteCellsUpdateSchema = createUpdateSchema(lteCells).strict();
const nrCellsUpdateSchema = createUpdateSchema(nrCells).strict();

const cellPatchSchema = cellsUpdateSchema.extend({
  cell_id: z.number(),
  details: z.union([gsmCellsUpdateSchema, umtsCellsUpdateSchema, lteCellsUpdateSchema, nrCellsUpdateSchema]).optional(),
});

const schemaRoute = {
  params: z.object({
    station_id: z.coerce.number<number>(),
  }),
  body: z.object({
    cells: z.array(cellPatchSchema).min(1),
  }),
  response: {
    200: z.object({
      data: z.array(cellsSelectSchema.extend({ details: cellDetailsSchema })),
    }),
  },
};

type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type ReqBody = { Body: { cells: z.infer<typeof cellPatchSchema>[] } };
type RequestData = ReqParams & ReqBody;
type ResponseData = (z.infer<typeof cellsSelectSchema> & { details: z.infer<typeof cellDetailsSchema> })[];

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const { station_id } = req.params;
  const { cells: cellsData } = req.body;

  const station = await db.query.stations.findFirst({ where: { id: station_id } });
  if (!station) throw new ErrorResponse("NOT_FOUND");

  const existingCells = await db.query.cells.findMany({
    where: {
      RAW: (fields, { inArray }) =>
        inArray(
          fields.id,
          cellsData.map((c) => c.cell_id),
        ),
    },
  });

  for (const cellData of cellsData) {
    const existing = existingCells.find((c) => c.id === cellData.cell_id);
    if (!existing || existing.station_id !== station_id) throw new ErrorResponse("NOT_FOUND");
  }

  if (station.operator_id) {
    for (const cellData of cellsData) {
      if (!cellData.details) continue;
      const existing = existingCells.find((c) => c.id === cellData.cell_id)!;

      if (existing.rat === "GSM") {
        const d = cellData.details as z.infer<typeof gsmCellsUpdateSchema>;
        if (d.lac !== undefined && d.cid !== undefined) {
          /* eslint-disable-next-line no-await-in-loop */
          await checkGSMDuplicate(d.lac, d.cid, station.operator_id, cellData.cell_id);
        }
      } else if (existing.rat === "UMTS") {
        const d = cellData.details as z.infer<typeof umtsCellsUpdateSchema>;
        if (d.rnc !== undefined && d.cid !== undefined) {
          /* eslint-disable-next-line no-await-in-loop */
          await checkUMTSDuplicate(d.rnc, d.cid, station.operator_id, cellData.cell_id);
        }
      } else if (existing.rat === "LTE") {
        const d = cellData.details as z.infer<typeof lteCellsUpdateSchema>;
        if (d.enbid !== undefined && d.clid !== undefined) {
          /* eslint-disable-next-line no-await-in-loop */
          await checkLTEDuplicate(d.enbid, d.clid, station.operator_id, cellData.cell_id);
        }
      }
    }
  }

  try {
    const updated = await db.transaction(async (tx) => {
      const results: z.infer<typeof cellsSelectSchema>[] = [];

      for (const cellData of cellsData) {
        const { cell_id, details, ...patch } = cellData;
        const existing = existingCells.find((c) => c.id === cell_id)!;

        /* eslint-disable-next-line no-await-in-loop */
        const [updatedCell] = await tx
          .update(cells)
          .set({ ...patch, updatedAt: new Date() })
          .where(eq(cells.id, cell_id))
          .returning();
        if (!updatedCell) throw new ErrorResponse("FAILED_TO_UPDATE");

        if (details) {
          switch (existing.rat) {
            case "GSM": {
              /* eslint-disable-next-line no-await-in-loop */
              const [row] = await tx
                .update(gsmCells)
                .set(details as z.infer<typeof gsmCellsUpdateSchema>)
                .where(eq(gsmCells.cell_id, cell_id))
                .returning();
              if (!row)
                throw new ErrorResponse("FAILED_TO_UPDATE", {
                  message: "This cell has no GSM data assigned. Try removing the cell first and re-adding it with the actual data",
                });
              break;
            }
            case "UMTS": {
              /* eslint-disable-next-line no-await-in-loop */
              const [row] = await tx
                .update(umtsCells)
                .set(details as z.infer<typeof umtsCellsUpdateSchema>)
                .where(eq(umtsCells.cell_id, cell_id))
                .returning();
              if (!row)
                throw new ErrorResponse("FAILED_TO_UPDATE", {
                  message: "This cell has no UMTS data assigned. Try removing the cell first and re-adding it with the actual data",
                });
              break;
            }
            case "LTE": {
              /* eslint-disable-next-line no-await-in-loop */
              const [row] = await tx
                .update(lteCells)
                .set(details as z.infer<typeof lteCellsUpdateSchema>)
                .where(eq(lteCells.cell_id, cell_id))
                .returning();
              if (!row)
                throw new ErrorResponse("FAILED_TO_UPDATE", {
                  message: "This cell has no LTE data assigned. Try removing the cell first and re-adding it with the actual data",
                });
              break;
            }
            case "NR": {
              /* eslint-disable-next-line no-await-in-loop */
              const [row] = await tx
                .update(nrCells)
                .set(details as z.infer<typeof nrCellsUpdateSchema>)
                .where(eq(nrCells.cell_id, cell_id))
                .returning();
              if (!row)
                throw new ErrorResponse("FAILED_TO_UPDATE", {
                  message: "This cell has no NR data assigned. Try removing the cell first and re-adding it with the actual data",
                });
              break;
            }
          }
        }

        results.push(updatedCell);
      }

      return results;
    });

    const ids = updated.map((c) => c.id);
    const full = await db.query.cells.findMany({
      where: {
        RAW: (fields, { inArray }) => inArray(fields.id, ids),
      },
      with: {
        gsm: { columns: { cell_id: false } },
        umts: { columns: { cell_id: false } },
        lte: { columns: { cell_id: false } },
        nr: { columns: { cell_id: false } },
      },
    });

    const response: ResponseData = updated.map((cell) => {
      const fullCell = full.find((c) => c.id === cell.id);
      const details = fullCell?.gsm ?? fullCell?.umts ?? fullCell?.lte ?? fullCell?.nr ?? undefined;
      return { ...cell, details };
    });

    await Promise.all(
      response.map((cell, idx) => {
        const oldCell = existingCells.find((c) => c.id === cell.id);
        return createAuditLog(
          {
            action: "cells.update",
            table_name: "cells",
            record_id: cell.id,
            old_values: oldCell,
            new_values: cell,
            metadata: { station_id },
          },
          req,
        );
      }),
    );

    const [updatedStation] = await db.update(stations).set({ updatedAt: new Date() }).where(eq(stations.id, station_id)).returning();
    await createAuditLog(
      {
        action: "stations.update",
        table_name: "stations",
        record_id: station_id,
        old_values: { updatedAt: station.updatedAt },
        new_values: { updatedAt: updatedStation?.updatedAt },
        metadata: { reason: "cells.update" },
      },
      req,
    );

    return res.send({ data: response });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("FAILED_TO_UPDATE");
  }
}

const updateCells: Route<RequestData, ResponseData> = {
  url: "/stations/:station_id/cells",
  method: "PATCH",
  schema: schemaRoute,
  config: { permissions: ["write:stations"] },
  handler,
};

export default updateCells;
