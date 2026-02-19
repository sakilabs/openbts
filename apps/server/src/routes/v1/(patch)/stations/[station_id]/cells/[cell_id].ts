import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { cells, gsmCells, umtsCells, lteCells, nrCells } from "@openbts/drizzle";

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
const requestSchema = cellsUpdateSchema.extend({
  details: z.union([gsmCellsUpdateSchema, umtsCellsUpdateSchema, lteCellsUpdateSchema, nrCellsUpdateSchema]).optional(),
});
const schemaRoute = {
  params: z.object({
    station_id: z.coerce.number<number>(),
    cell_id: z.coerce.number<number>(),
  }),
  body: requestSchema,
  response: {
    200: z.object({
      data: cellsSelectSchema.extend({ details: cellDetailsSchema }),
    }),
  },
};
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type ReqBody = { Body: z.infer<typeof requestSchema> };
type RequestData = ReqBody & ReqParams;
type ResponseData = z.infer<typeof cellsSelectSchema> & { details: z.infer<typeof cellDetailsSchema> };

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const { station_id, cell_id } = req.params;
  if (Number.isNaN(station_id) || Number.isNaN(cell_id)) throw new ErrorResponse("INVALID_QUERY");

  const station = await db.query.stations.findFirst({
    where: {
      id: station_id,
    },
  });
  if (!station) throw new ErrorResponse("NOT_FOUND");

  const cell = await db.query.cells.findFirst({
    where: {
      AND: [{ id: cell_id }, { station_id: station_id }],
    },
  });
  if (!cell) throw new ErrorResponse("NOT_FOUND");

  try {
    const [updated] = await db
      .update(cells)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(cells.id, cell_id))
      .returning();
    if (!updated) throw new ErrorResponse("FAILED_TO_UPDATE");

    if (req.body.details) {
      switch (updated.rat) {
        case "GSM":
          {
            const details = req.body.details as z.infer<typeof gsmCellsUpdateSchema>;
            const [existing] = await db.update(gsmCells).set(details).where(eq(gsmCells.cell_id, cell_id)).returning();
            if (!existing) {
              throw new ErrorResponse("FAILED_TO_UPDATE", {
                message: "This cell has no GSM data assigned. Try removing the cell first and re-adding it with the actual data",
              });
            }
          }
          break;
        case "UMTS":
          {
            const details = req.body.details as z.infer<typeof umtsCellsUpdateSchema>;
            const [existing] = await db.update(umtsCells).set(details).where(eq(umtsCells.cell_id, cell_id)).returning();
            if (!existing) {
              throw new ErrorResponse("FAILED_TO_UPDATE", {
                message: "This cell has no UMTS data assigned. Try removing the cell first and re-adding it with the actual data",
              });
            }
          }
          break;
        case "LTE":
          {
            const details = req.body.details as z.infer<typeof lteCellsUpdateSchema>;
            const [existing] = await db.update(lteCells).set(details).where(eq(lteCells.cell_id, cell_id)).returning();
            if (!existing) {
              throw new ErrorResponse("FAILED_TO_UPDATE", {
                message: "This cell has no LTE data assigned. Try removing the cell first and re-adding it with the actual data",
              });
            }
          }
          break;
        case "NR":
          {
            const details = req.body.details as z.infer<typeof nrCellsUpdateSchema>;
            const [existing] = await db.update(nrCells).set(details).where(eq(nrCells.cell_id, cell_id)).returning();
            if (!existing) {
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
        id: cell_id,
      },
      with: {
        gsm: { columns: { cell_id: false } },
        umts: { columns: { cell_id: false } },
        lte: { columns: { cell_id: false } },
        nr: { columns: { cell_id: false } },
      },
    });
    if (!full) throw new ErrorResponse("FAILED_TO_UPDATE");
    const details = full?.gsm ?? full?.umts ?? full?.lte ?? full?.nr ?? null;
    return res.send({ data: { ...updated, details } });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("FAILED_TO_UPDATE");
  }
}

const updateCell: Route<RequestData, ResponseData> = {
  url: "/stations/:station_id/cells/:cell_id",
  method: "PATCH",
  schema: schemaRoute,
  config: { permissions: ["write:stations"] },
  handler,
};

export default updateCell;
