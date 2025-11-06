import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { cells, gsmCells, umtsCells, lteCells, nrCells } from "@openbts/drizzle";

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
const gsmCellsSchema = createSelectSchema(gsmCells).omit({ cell_id: true });
const umtsCellsSchema = createSelectSchema(umtsCells).omit({ cell_id: true });
const lteCellsSchema = createSelectSchema(lteCells).omit({ cell_id: true });
const nrCellsSchema = createSelectSchema(nrCells).omit({ cell_id: true });
const cellDetailsSchema = z.union([gsmCellsSchema, umtsCellsSchema, lteCellsSchema, nrCellsSchema]).nullable();
const gsmUpdateSchema = createUpdateSchema(gsmCells).omit({
	createdAt: true,
	updatedAt: true,
});
const umtsUpdateSchema = createUpdateSchema(umtsCells).omit({
	createdAt: true,
	updatedAt: true,
});
const lteUpdateSchema = createUpdateSchema(lteCells).omit({
	createdAt: true,
	updatedAt: true,
});
const nrUpdateSchema = createUpdateSchema(nrCells).omit({
	createdAt: true,
	updatedAt: true,
});
const requestSchema = cellsUpdateSchema.extend({
	details: z.union([gsmUpdateSchema, umtsUpdateSchema, lteUpdateSchema, nrUpdateSchema]).optional(),
});

const schemaRoute = {
	params: z.object({
		cell_id: z.coerce.number<number>(),
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
	const { cell_id } = req.params;

	const cell = await db.query.cells.findFirst({
		where: (fields, { eq }) => eq(fields.id, cell_id),
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
			switch (cell.rat) {
				case "GSM":
					{
						const details = req.body.details as z.infer<typeof gsmUpdateSchema>;
						const [updated] = await db.update(gsmCells).set(details).where(eq(gsmCells.cell_id, cell_id)).returning();
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
						const [updated] = await db.update(umtsCells).set(details).where(eq(umtsCells.cell_id, cell_id)).returning();
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
						const [updated] = await db.update(lteCells).set(details).where(eq(lteCells.cell_id, cell_id)).returning();
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
						const [updated] = await db.update(nrCells).set(details).where(eq(nrCells.cell_id, cell_id)).returning();
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
			where: (fields, { eq }) => eq(fields.id, cell_id),
			with: { gsm: true, umts: true, lte: true, nr: true },
		});
		const details = full?.gsm ?? full?.umts ?? full?.lte ?? full?.nr ?? null;

		return res.send({ data: { ...updated, details } });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("FAILED_TO_UPDATE");
	}
}

const updateCell: Route<RequestData, ResponseData> = {
	url: "/cells/:cell_id",
	method: "PATCH",
	config: { permissions: ["write:cells"] },
	schema: schemaRoute,
	handler,
};

export default updateCell;
