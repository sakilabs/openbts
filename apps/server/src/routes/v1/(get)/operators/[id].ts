import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { operators } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ResponseData = Omit<typeof operators.$inferSelect, "is_visible">;
const operatorsSchema = createSelectSchema(operators).omit({ is_visible: true });
const schemaRoute = {
	params: z.object({
		id: z.number(),
	}),
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: operatorsSchema,
		}),
	}),
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;

	const operator = await db.query.operators.findFirst({
		where: (fields, { eq }) => eq(fields.id, id),
		columns: {
			is_visible: false,
		},
	});
	if (!operator) throw new ErrorResponse("NOT_FOUND");

	return res.send({ success: true, data: operator });
}

const getOperator: Route<IdParams, ResponseData> = {
	url: "/operators/:id",
	method: "GET",
	config: { permissions: ["read:operators"] },
	schema: schemaRoute,
	handler,
};

export default getOperator;
