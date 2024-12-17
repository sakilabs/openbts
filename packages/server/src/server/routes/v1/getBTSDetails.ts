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
						latitude: { type: "number" },
						longitude: { type: "number" },
						owner: { type: ["number", "null"] },
						type: { type: ["string", "null"] },
						region: { type: ["number", "null"] },
						location_type: { type: ["string", "null"] },
						mno: {
							type: "object",
							properties: {
								mno_id: { type: ["number", "null"] },
								mno_name: { type: ["string", "null"] },
							},
						},
						networks: {
							type: "object",
							properties: {
								networks_id: { type: ["number", "null"] },
								networks_name: { type: ["string", "null"] },
							},
						},
					},
				},
			},
		},
	},
};

const getBTSStation: Route = {
	url: "/bts/:bts_id",
	method: "GET",
	schema: schemaRoute,
	onRequest: AuthMiddleware,
	handler: async (req: FastifyRequest<{ Params: { bts_id: string } }>, res: ReplyPayload<BasicResponse<unknown>>) => {
		const { bts_id } = req.params;
		const btsStation = await db.query.stations.findFirst({
			where: (fields, { eq }) => eq(fields.bts_id, Number(bts_id)),
			with: {
				mno: true,
				networks: true,
			},
			columns: {
				mno_id: false,
				networks_id: false,
			},
		});
		if (!btsStation) return res.status(404).send({ success: false, error: "Station not found" });

		const dataRes = {
			...btsStation,
			mno: btsStation.mno
				? {
						mno_id: btsStation.mno.mno_id,
						mno_name: btsStation.mno.mno_name,
					}
				: undefined,
			networks: btsStation.networks
				? {
						networks_id: btsStation.networks.networks_id,
						networks_name: btsStation.networks.networks_name,
					}
				: undefined,
		};

		res.send({ success: true, data: dataRes });
	},
};

export default getBTSStation;
