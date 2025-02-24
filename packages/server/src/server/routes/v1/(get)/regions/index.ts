import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { regions } from "@openbts/drizzle";
import type { RouteGenericInterface } from "fastify";

type Region = typeof regions.$inferSelect;

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<Region[]>>) {
	const regions = await db.query.regions.findMany();
	return res.send({ success: true, data: regions });
}

const getRegions: Route<RouteGenericInterface, Region[]> = {
	url: "/regions",
	method: "GET",
	config: { permissions: ["read:regions"] },
	handler,
};

export default getRegions;
