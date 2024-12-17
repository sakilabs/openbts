import { db } from "../../database/index.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../interfaces/routes.interface.js";

const schemaRoute = {
	params: {
		type: "object",
		properties: {
			bts_id: { type: "string" },
		},
	},
	response: {
		200: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				data: {
					type: "object",
					properties: {
						bts_id: { type: "number" },
						city: { type: ["string", "null"] },
						street: { type: ["string", "null"] },
						street_number: { type: ["string", "null"] },
						municipality: { type: ["string", "null"] },
						district: { type: ["string", "null"] },
						province: { type: ["string", "null"] },
						cluster: { type: "number" },
					},
				},
			},
		},
	},
};

const getExtraBTSInfo: Route = {
	url: "/bts/:bts_id/details",
	method: "GET",
	schema: schemaRoute,
	onRequest: AuthMiddleware,
	handler: async (req: FastifyRequest<{ Params: { bts_id: string } }>, res: ReplyPayload<BasicResponse<unknown>>) => {
		const { bts_id } = req.params;
		if (!bts_id) return res.status(400).send({ success: false, error: "Missing BTS ID" });
		const extraInfo = await db.query.stationsExtra.findFirst({
			where: (fields, { eq }) => eq(fields.bts_id, Number(bts_id)),
			columns: {
				id: false,
			},
		});
		if (!extraInfo) return res.status(500).send({ success: false, error: "Failed to retrieve extra BTS information" });
		res.send({ success: true, data: extraInfo });
	},
};

export default getExtraBTSInfo;
