import { cells, gsmCells, umtsCells, lteCells, nrCells, stations } from "@openbts/drizzle";
import { eq } from "drizzle-orm";
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { createAuditLog } from "../../../../services/auditLog.service.js";
import {
  checkGSMDuplicate,
  checkUMTSDuplicate,
  checkLTEDuplicate,
  getOperatorIdForStation,
} from "../../../../services/cellDuplicateCheck.service.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const cellsSelectSchema = createSelectSchema(cells);
const gsmCellsSchema = createSelectSchema(gsmCells);
const umtsCellsSchema = createSelectSchema(umtsCells);
const lteCellsSchema = createSelectSchema(lteCells);
const nrCellsSchema = createSelectSchema(nrCells);
const cellDetailsSchema = z.union([gsmCellsSchema, umtsCellsSchema, lteCellsSchema, nrCellsSchema]).nullable();
const cellsInsertSchema = createInsertSchema(cells)
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .strict();
const gsmInsertSchema = createInsertSchema(gsmCells).omit({ cell_id: true, createdAt: true, updatedAt: true }).strict();
const umtsInsertSchema = createInsertSchema(umtsCells).omit({ cell_id: true, createdAt: true, updatedAt: true }).strict();
const lteInsertSchema = createInsertSchema(lteCells).omit({ cell_id: true, createdAt: true, updatedAt: true }).strict();
const nrInsertSchema = createInsertSchema(nrCells).omit({ cell_id: true, createdAt: true, updatedAt: true }).strict();

const requestSchema = cellsInsertSchema.extend({
  details: z.union([gsmInsertSchema, umtsInsertSchema, lteInsertSchema, nrInsertSchema]).optional(),
});

type ReqWithDetails = { Body: z.infer<typeof requestSchema> };

type ResponseData = z.infer<typeof cellsSelectSchema> & { details: z.infer<typeof cellDetailsSchema> };
const schemaRoute = {
  body: requestSchema,
  response: {
    200: z.object({
      data: cellsSelectSchema.extend({ details: cellDetailsSchema }),
    }),
  },
};

async function handler(req: FastifyRequest<ReqWithDetails>, res: ReplyPayload<JSONBody<ResponseData>>) {
  try {
    if (req.body.details && req.body.station_id) {
      const operatorId = await getOperatorIdForStation(req.body.station_id);
      if (operatorId) {
        if (req.body.rat === "GSM") {
          const d = req.body.details as z.infer<typeof gsmInsertSchema>;
          await checkGSMDuplicate(d.lac, d.cid, operatorId);
        } else if (req.body.rat === "UMTS") {
          const d = req.body.details as z.infer<typeof umtsInsertSchema>;
          await checkUMTSDuplicate(d.rnc, d.cid, operatorId);
        } else if (req.body.rat === "LTE") {
          const d = req.body.details as z.infer<typeof lteInsertSchema>;
          await checkLTEDuplicate(d.enbid, d.clid, operatorId);
        }
      }
    }

    const [inserted] = await db.insert(cells).values(req.body).returning();
    if (!inserted) throw new ErrorResponse("FAILED_TO_CREATE");

    let details: z.infer<typeof cellDetailsSchema> = null;
    if (req.body.details) {
      switch (inserted.rat) {
        case "GSM":
          {
            const d = req.body.details as z.infer<typeof gsmInsertSchema>;
            await db.insert(gsmCells).values({ ...d, cell_id: inserted.id });
            details = {
              lac: d.lac,
              cid: d.cid,
            } as z.infer<typeof gsmCellsSchema>;
          }
          break;
        case "UMTS":
          {
            const d = req.body.details as z.infer<typeof umtsInsertSchema>;
            await db.insert(umtsCells).values({ ...d, cell_id: inserted.id });
            details = {
              lac: d.lac ?? null,
              arfcn: d.arfcn ?? null,
              rnc: d.rnc,
              cid: d.cid,
            } as z.infer<typeof umtsCellsSchema>;
          }
          break;
        case "LTE":
          {
            const d = req.body.details as z.infer<typeof lteInsertSchema>;
            await db.insert(lteCells).values({ ...d, cell_id: inserted.id });
            details = {
              tac: d.tac ?? null,
              enbid: d.enbid,
              clid: d.clid,
              supports_nb_iot: d.supports_nb_iot ?? null,
            } as z.infer<typeof lteCellsSchema>;
          }
          break;
        case "NR":
          {
            const d = req.body.details as z.infer<typeof nrInsertSchema>;
            await db.insert(nrCells).values({ ...d, cell_id: inserted.id, gnbid_length: d.gnbid ? d.gnbid.toString(2).length : undefined });
            details = {
              nrtac: d.nrtac ?? null,
              gnbid: d.gnbid ?? null,
              clid: d.clid,
              supports_nr_redcap: d.supports_nr_redcap ?? null,
            } as z.infer<typeof nrCellsSchema>;
          }
          break;
      }
    }

    await createAuditLog(
      {
        action: "cells.create",
        table_name: "cells",
        record_id: inserted.id,
        old_values: null,
        new_values: { ...inserted, details },
      },
      req,
    );

    await db.update(stations).set({ updatedAt: new Date() }).where(eq(stations.id, inserted.station_id));
    await createAuditLog(
      {
        action: "stations.update",
        table_name: "stations",
        record_id: inserted.station_id,
        new_values: { updatedAt: new Date() },
        metadata: { reason: "cells.create" },
      },
      req,
    );

    return res.send({ data: { ...inserted, details } as ResponseData });
  } catch {
    throw new ErrorResponse("FAILED_TO_CREATE");
  }
}

const createCell: Route<ReqWithDetails, ResponseData> = {
  url: "/cells",
  method: "POST",
  config: { permissions: ["write:cells"] },
  schema: schemaRoute,
  handler,
};

export default createCell;
