import { operators } from "@openbts/drizzle";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const operatorsSelectSchema = createSelectSchema(operators);
const operatorsInsertSchema = createInsertSchema(operators).strict();
type ReqBody = { Body: z.infer<typeof operatorsInsertSchema> };
type ResponseData = z.infer<typeof operatorsSelectSchema>;
const schemaRoute = {
	body: operatorsInsertSchema,
	response: {
		200: z.object({
			success: z.boolean(),
			data: operatorsSelectSchema,
		}),
	},
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	try {
		const operator = await db.insert(operators).values(req.body).returning();

		return res.send({ success: true, data: operator[0] });
	} catch {
		throw new ErrorResponse("FAILED_TO_CREATE");
	}
}

const createOperator: Route<ReqBody, ResponseData> = {
	url: "/operators",
	method: "POST",
	config: { permissions: ["write:operators"] },
	schema: schemaRoute,
	handler,
};

export default createOperator;
