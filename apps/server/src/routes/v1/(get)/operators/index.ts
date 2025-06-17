import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { operators } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { RouteGenericInterface } from "fastify";

type ResponseData = Omit<typeof operators.$inferSelect, "is_visible">;
const operatorsSchema = createSelectSchema(operators).omit({ is_visible: true });
const schemaRoute = {
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: operatorsSchema,
		}),
	}),
};

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData[]>>) {
	const operators = await db.query.operators.findMany({
		where: (fields, { eq }) => eq(fields.is_visible, true),
		columns: {
			is_visible: false,
		},
	});
	return res.send({ success: true, data: operators });
}

const getOperators: Route<RouteGenericInterface, ResponseData[]> = {
	url: "/operators",
	method: "GET",
	config: { permissions: ["read:operators"] },
	schema: schemaRoute,
	handler,
};

export default getOperators;
