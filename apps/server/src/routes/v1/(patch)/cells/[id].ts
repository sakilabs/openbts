import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { createAuditLog } from "../../../../services/auditLog.service.js";
import { checkGSMDuplicate, checkLTEDuplicate, getOperatorIdForStation } from "../../../../services/cellDuplicateCheck.service.js";
import { cells, gsmCells, umtsCells, lteCells, nrCells, stations } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const cellsUpdateSchema = createUpdateSchema(cells)
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .strict();
const cellsSelectSchema = createSelectSchema(cells);
const gsmCellsSchema = createSelectSchema(gsmCells).omit({ cell_id: true }).strict();
const umtsCellsSchema = createSelectSchema(umtsCells).omit({ cell_id: true }).strict();
const lteCellsSchema = createSelectSchema(lteCells).omit({ cell_id: true }).strict();
const nrCellsSchema = createSelectSchema(nrCells).omit({ cell_id: true }).strict();
const cellDetailsSchema = z.union([gsmCellsSchema, umtsCellsSchema, lteCellsSchema, nrCellsSchema]).nullable();
const gsmUpdateSchema = createUpdateSchema(gsmCells)
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .strict();
const umtsUpdateSchema = createUpdateSchema(umtsCells)
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .strict();
const lteUpdateSchema = createUpdateSchema(lteCells)
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .strict();
const nrUpdateSchema = createUpdateSchema(nrCells)
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .strict();
const requestSchema = cellsUpdateSchema.extend({
  details: z.union([gsmUpdateSchema, umtsUpdateSchema, lteUpdateSchema, nrUpdateSchema]).optional(),
});

const schemaRoute = {
  params: z.object({
    id: z.coerce.number<number>(),
  }),
  body: requestSchema,
  response: {
    200: z.object({
      data: cellsSelectSchema.extend({ details: cellDetailsSchema }),
    }),
  },
};
type ReqBody = { Body: z.infer<typeof requestSchema> };
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type RequestData = ReqBody & ReqParams;
type ResponseData = z.infer<typeof cellsSelectSchema> & { details: z.infer<typeof cellDetailsSchema> };

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const { id } = req.params;

  const cell = await db.query.cells.findFirst({
    where: { id },
    with: { gsm: true, umts: true, lte: true, nr: true },
  });
  if (!cell) throw new ErrorResponse("NOT_FOUND");

  if (req.body.details) {
    const operatorId = await getOperatorIdForStation(cell.station_id);
    if (operatorId) {
      if (cell.rat === "GSM") {
        const d = req.body.details as z.infer<typeof gsmUpdateSchema>;
        if (d.lac !== undefined && d.cid !== undefined) await checkGSMDuplicate(d.lac, d.cid, operatorId, id);
      } else if (cell.rat === "LTE") {
        const d = req.body.details as z.infer<typeof lteUpdateSchema>;
        if (d.enbid !== undefined && d.clid !== undefined) await checkLTEDuplicate(d.enbid, d.clid, operatorId, id);
      }
    }
  }

  try {
    const [updated] = await db
      .update(cells)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(cells.id, id))
      .returning();
    if (!updated) throw new ErrorResponse("FAILED_TO_UPDATE");

    if (req.body.details) {
      switch (cell.rat) {
        case "GSM":
          {
            const details = req.body.details as z.infer<typeof gsmUpdateSchema>;
            const [updated] = await db.update(gsmCells).set(details).where(eq(gsmCells.cell_id, id)).returning();
            if (!updated) {
              throw new ErrorResponse("FAILED_TO_UPDATE", {
                message: "This cell has no NR data assigned. Try removing the cell first and re-adding it with the actual data",
              });
            }
          }
          break;
        case "UMTS":
          {
            const details = req.body.details as z.infer<typeof umtsUpdateSchema>;
            const [updated] = await db.update(umtsCells).set(details).where(eq(umtsCells.cell_id, id)).returning();
            if (!updated) {
              throw new ErrorResponse("FAILED_TO_UPDATE", {
                message: "This cell has no NR data assigned. Try removing the cell first and re-adding it with the actual data",
              });
            }
          }
          break;
        case "LTE":
          {
            const details = req.body.details as z.infer<typeof lteUpdateSchema>;
            const [updated] = await db.update(lteCells).set(details).where(eq(lteCells.cell_id, id)).returning();
            if (!updated) {
              throw new ErrorResponse("FAILED_TO_UPDATE", {
                message: "This cell has no NR data assigned. Try removing the cell first and re-adding it with the actual data",
              });
            }
          }
          break;
        case "NR":
          {
            const details = req.body.details as z.infer<typeof nrUpdateSchema>;
            const [updated] = await db
              .update(nrCells)
              .set({ ...details, ...(details.gnbid ? { gnbid_length: details.gnbid.toString(2).length } : {}) })
              .where(eq(nrCells.cell_id, id))
              .returning();
            if (!updated) {
              throw new ErrorResponse("FAILED_TO_UPDATE", {
                message: "This cell has no NR data assigned. Try removing the cell first and re-adding it with the actual data",
              });
            }
          }
          break;
      }
    }

    const full = await db.query.cells.findFirst({
      where: {
        id,
      },
      with: { gsm: true, umts: true, lte: true, nr: true },
    });
    const details = full?.gsm ?? full?.umts ?? full?.lte ?? full?.nr ?? null;

    const { gsm, umts, lte, nr, ...oldBase } = cell;
    const oldDetails = cell.gsm ?? cell.umts ?? cell.lte ?? cell.nr ?? null;
    await createAuditLog(
      {
        action: "cells.update",
        table_name: "cells",
        record_id: id,
        old_values: { ...oldBase, details: oldDetails },
        new_values: { ...updated, details },
      },
      req,
    );

    await db.update(stations).set({ updatedAt: new Date() }).where(eq(stations.id, cell.station_id));
    await createAuditLog(
      {
        action: "stations.update",
        table_name: "stations",
        record_id: cell.station_id,
        new_values: { updatedAt: new Date() },
        metadata: { reason: "cells.update" },
      },
      req,
    );

    return res.send({ data: { ...updated, details } });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("FAILED_TO_UPDATE");
  }
}

const updateCell: Route<RequestData, ResponseData> = {
  url: "/cells/:id",
  method: "PATCH",
  config: { permissions: ["write:cells"] },
  schema: schemaRoute,
  handler,
};

export default updateCell;
