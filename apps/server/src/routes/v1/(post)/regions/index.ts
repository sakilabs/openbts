import { regions } from "@openbts/drizzle";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const regionsSelectSchema = createSelectSchema(regions);
const regionsInsertSchema = createInsertSchema(regions).strict();
type ReqBody = { Body: z.infer<typeof regionsInsertSchema> };
type ResponseData = z.infer<typeof regionsSelectSchema>;
const schemaRoute = {
	body: regionsInsertSchema,
	response: {
		200: z.object({
			success: z.boolean(),
			data: regionsSelectSchema,
		}),
	},
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
