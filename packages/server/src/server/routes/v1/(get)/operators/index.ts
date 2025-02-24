import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { operators } from "@openbts/drizzle";
import type { RouteGenericInterface } from "fastify";

type ResponseData = typeof operators.$inferSelect;

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData[]>>) {
	const operators = await db.query.operators.findMany();
	return res.send({ success: true, data: operators });
}

const getOperators: Route<RouteGenericInterface, ResponseData[]> = {
	url: "/operators",
	method: "GET",
	config: { permissions: ["read:operators"] },
	handler,
};

export default getOperators;
