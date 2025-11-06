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
const operatorsSelectSchema = createSelectSchema(operators).omit({ is_isp: true });
const schemaRoute = {
	params: z.object({
		operator_id: z.coerce.number<number>(),
	}),
	body: operatorsUpdateSchema,
	response: {
		200: z.object({
			data: operatorsSelectSchema,
		}),
	},
};
type ReqBody = { Body: z.infer<typeof operatorsUpdateSchema> };
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type RequestData = ReqBody & ReqParams;
type ResponseData = z.infer<typeof operatorsSelectSchema>;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { operator_id } = req.params;

	const operator = await db.query.operators.findFirst({
		where: (fields, { eq }) => eq(fields.id, operator_id),
	});
	if (!operator) throw new ErrorResponse("NOT_FOUND");

	try {
		const [updated] = await db.update(operators).set(req.body).where(eq(operators.id, operator_id)).returning();
		if (!updated) throw new ErrorResponse("FAILED_TO_UPDATE");

		return res.send({ data: updated });
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
