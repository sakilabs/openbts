import db from "../../../../database/psql.js";

import type { locations, regions } from "@openbts/drizzle";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { RouteGenericInterface } from "fastify";

type ResponseData = typeof locations.$inferSelect & { region: typeof regions.$inferSelect };

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData[]>>) {
	const locations = await db.query.locations.findMany({
		with: {
			region: true,
		},
	});
	return res.send({ success: true, data: locations });
}

const getLocations: Route<RouteGenericInterface, ResponseData[]> = {
	url: "/locations",
	method: "GET",
	config: { permissions: ["read:locations"] },
	handler,
};

export default getLocations;
