import db from "../../../../database/psql.js";

import type { cells, stations, bands } from "@openbts/drizzle";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { RouteGenericInterface } from "fastify";

type ResponseData = typeof cells.$inferSelect & {
	station: typeof stations.$inferSelect;
	band: typeof bands.$inferSelect;
};

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData[]>>) {
	const cells = await db.query.cells.findMany({
		with: {
			station: true,
			band: true,
		},
	});

	return res.send({ success: true, data: cells });
}

const getCells: Route<RouteGenericInterface, ResponseData[]> = {
	url: "/cells",
	method: "GET",
	config: { permissions: ["read:cells"] },
	handler,
};

export default getCells;
