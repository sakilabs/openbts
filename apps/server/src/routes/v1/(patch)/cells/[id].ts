import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { cells } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const cellsUpdateSchema = createUpdateSchema(cells).strict();
const cellsSelectSchema = createSelectSchema(cells);
type ReqBody = { Body: z.infer<typeof cellsUpdateSchema> };
type ReqParams = { Params: { cell_id: number } };
type RequestData = ReqBody & ReqParams;
type ResponseData = z.infer<typeof cellsSelectSchema>;
const schemaRoute = {
	params: z.object({
		cell_id: z.number(),
	}),
	body: cellsUpdateSchema,
	response: {
		200: z.object({
			success: z.boolean(),
			data: cellsSelectSchema,
		}),
	},
};

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { cell_id } = req.params;

	try {
		const cell = await db
			.update(cells)
			.set({
				...req.body,
				last_updated: new Date(),
			})
			.where(eq(cells.id, cell_id))
			.returning();
		if (!cell.length) throw new ErrorResponse("NOT_FOUND");

		return res.send({ success: true, data: cell[0] });
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
