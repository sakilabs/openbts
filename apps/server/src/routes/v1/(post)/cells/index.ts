import { cells } from "@openbts/drizzle";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const cellsSelectSchema = createSelectSchema(cells);
const cellsInsertSchema = createInsertSchema(cells)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.strict();
type ReqBody = { Body: z.infer<typeof cellsInsertSchema> };
type ResponseData = z.infer<typeof cellsSelectSchema>;
const schemaRoute = {
	body: cellsInsertSchema,
	response: {
		200: z.object({
			success: z.boolean(),
			data: cellsSelectSchema,
		}),
	},
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	try {
		const cell = await db
			.insert(cells)
			.values({
				...req.body,
				updatedAt: new Date(),
				createdAt: new Date(),
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
