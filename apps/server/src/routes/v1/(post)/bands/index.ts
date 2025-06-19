import { bands } from "@openbts/drizzle";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const bandsSelectSchema = createSelectSchema(bands).strict();
const bandsInsertSchema = createInsertSchema(bands);
type ReqBody = { Body: z.infer<typeof bandsInsertSchema> };
type ResponseData = z.infer<typeof bandsSelectSchema>;
const schemaRoute = {
	body: bandsInsertSchema,
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: bandsSelectSchema,
		}),
	}),
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	try {
		const band = await db.insert(bands).values(req.body).returning();

		return res.send({ success: true, data: band[0] });
	} catch {
		throw new ErrorResponse("FAILED_TO_CREATE");
	}
}

const createBand: Route<ReqBody, ResponseData> = {
	url: "/bands",
	method: "POST",
	config: { permissions: ["write:bands"] },
	schema: schemaRoute,
	handler,
};

export default createBand;
