import { cells, gsmCells, umtsCells, lteCells, nrCells } from "@openbts/drizzle";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const cellsSelectSchema = createSelectSchema(cells);
const gsmCellsSchema = createSelectSchema(gsmCells).omit({ cell_id: true });
const umtsCellsSchema = createSelectSchema(umtsCells).omit({ cell_id: true });
const lteCellsSchema = createSelectSchema(lteCells).omit({ cell_id: true });
const nrCellsSchema = createSelectSchema(nrCells).omit({ cell_id: true });
const cellDetailsSchema = z.union([gsmCellsSchema, umtsCellsSchema, lteCellsSchema, nrCellsSchema]).nullable();
const cellsInsertSchema = createInsertSchema(cells)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.strict();
const gsmInsertSchema = createInsertSchema(gsmCells).omit({ createdAt: true, updatedAt: true });
const umtsInsertSchema = createInsertSchema(umtsCells).omit({ createdAt: true, updatedAt: true });
const lteInsertSchema = createInsertSchema(lteCells).omit({ createdAt: true, updatedAt: true });
const nrInsertSchema = createInsertSchema(nrCells).omit({ createdAt: true, updatedAt: true });

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
							carrier: d.carrier ?? null,
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
						await db.insert(nrCells).values({ ...d, cell_id: inserted.id });
						details = {
							nrtac: d.nrtac ?? null,
							gnbid: d.gnbid ?? null,
							clid: d.clid,
							nci: d.nci ?? null,
							supports_nr_redcap: d.supports_nr_redcap ?? null,
						} as z.infer<typeof nrCellsSchema>;
					}
					break;
			}
		}

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
