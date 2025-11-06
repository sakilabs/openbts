import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { operators } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { RouteGenericInterface } from "fastify";

const operatorsSchema = createSelectSchema(operators).omit({ is_isp: true });
const schemaRoute = {
	response: {
		200: z.object({
			data: z.array(operatorsSchema),
		}),
	},
};
type ResponseData = z.infer<typeof operatorsSchema>;

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData[]>>) {
	const operators = await db.query.operators.findMany({
		where: (fields, { eq }) => eq(fields.is_isp, true),
		columns: {
			is_isp: false,
		},
	});
	return res.send({ data: operators });
}

const getOperators: Route<RouteGenericInterface, ResponseData[]> = {
	url: "/operators",
	method: "GET",
	config: { permissions: ["read:operators"], allowGuestAccess: true },
	schema: schemaRoute,
	handler,
};

export default getOperators;
