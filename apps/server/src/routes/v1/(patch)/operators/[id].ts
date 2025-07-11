import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { operators } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const operatorsUpdateSchema = createUpdateSchema(operators).strict();
const operatorsSelectSchema = createSelectSchema(operators).omit({ is_visible: true });
type ReqBody = { Body: z.infer<typeof operatorsUpdateSchema> };
type ReqParams = { Params: { operator_id: number } };
type RequestData = ReqBody & ReqParams;
type ResponseData = z.infer<typeof operatorsSelectSchema>;
const schemaRoute = {
	params: z.object({
		operator_id: z.number(),
	}),
	body: operatorsUpdateSchema,
	response: {
		200: z.object({
			success: z.boolean(),
			data: operatorsSelectSchema,
		}),
	},
};

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { operator_id } = req.params;

	try {
		const operator = await db.update(operators).set(req.body).where(eq(operators.id, operator_id)).returning();
		if (!operator.length) throw new ErrorResponse("NOT_FOUND");

		return res.send({ success: true, data: operator[0] });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("FAILED_TO_UPDATE");
	}
}

const updateOperator: Route<RequestData, ResponseData> = {
	url: "/operators/:operator_id",
	method: "PATCH",
	config: { permissions: ["write:operators"] },
	schema: schemaRoute,
	handler,
};

export default updateOperator;
