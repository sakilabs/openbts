import { cells } from "@openbts/drizzle";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof cells.$inferInsert };
type ResponseData = typeof cells.$inferSelect;
const cellsSelectSchema = createSelectSchema(cells).strict();
const cellsInsertSchema = createInsertSchema(cells);
const schemaRoute = {
	body: cellsInsertSchema,
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: cellsSelectSchema,
		}),
	}),
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	try {
		const cell = await db
			.insert(cells)
			.values({
				...req.body,
				last_updated: new Date(),
				date_created: new Date(),
			})
			.returning();

		return res.send({ success: true, data: cell[0] });
	} catch {
		throw new ErrorResponse("FAILED_TO_CREATE");
	}
}

const createCell: Route<ReqBody, ResponseData> = {
	url: "/cells",
	method: "POST",
	config: { permissions: ["write:cells"] },
	schema: schemaRoute,
	handler,
};

export default createCell;
