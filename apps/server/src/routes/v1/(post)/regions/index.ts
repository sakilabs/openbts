import { regions } from "@openbts/drizzle";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof regions.$inferInsert };
type ResponseData = typeof regions.$inferSelect;
const regionsSelectSchema = createSelectSchema(regions).strict();
const regionsInsertSchema = createInsertSchema(regions);
const schemaRoute = {
	body: regionsInsertSchema,
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: regionsSelectSchema,
		}),
	}),
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { name } = req.body;

	try {
		const region = await db
			.insert(regions)
			.values({
				name,
			})
			.returning();

		return res.send({ success: true, data: region[0] });
	} catch {
		throw new ErrorResponse("FAILED_TO_CREATE");
	}
}

const createRegion: Route<ReqBody, ResponseData> = {
	url: "/regions",
	method: "POST",
	config: { permissions: ["write:regions"] },
	schema: schemaRoute,
	handler,
};

export default createRegion;
