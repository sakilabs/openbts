import { db } from "../../database/index.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../interfaces/routes.interface.js";

const schemaRoute = {
	response: {
		200: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				data: {
					type: "array",
					items: {
						type: "object",
						properties: {
							bts_id: { type: "number" },
							latitude: { type: "number" },
							longitude: { type: "number" },
							owner: { type: ["number", "null"] },
							type: { type: ["string", "null"] },
							region: { type: ["number", "null"] },
							mno_id: { type: ["number", "null"] },
							networks_id: { type: ["number", "null"] },
							location_type: { type: ["string", "null"] },
						},
					},
				},
			},
		},
	},
};

const getBTSStations: Route = {
	url: "/btsList",
	method: "GET",
	schema: schemaRoute,
	onRequest: AuthMiddleware,
	handler: async (_: FastifyRequest, res: ReplyPayload<BasicResponse<unknown>>) => {
		const btsStations = await db.query.stations.findMany({
			orderBy: (fields, operators) => [operators.asc(fields.bts_id)],
		});
		if (!btsStations) return res.status(404).send({ success: false, error: "Failed to retrieve BTS Stations" });
		res.send({ success: true, data: btsStations });
	},
};

export default getBTSStations;
