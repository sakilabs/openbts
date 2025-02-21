import db from "../../../../database/index.js";
import { i18n } from "../../../../i18n/index.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const getStation: Route = {
	url: "/stations/:id",
	method: "GET",
	config: { permissions: ["read:stations"] },
	handler: async (req: FastifyRequest<{ Params: { id: number } }>, res: ReplyPayload<JSONBody<unknown>>) => {
		const { id } = req.params;

		const station = await db.query.stations.findFirst({
			where: (fields, { eq }) => eq(fields.bts_id, Number(id)),
		});

		if (!station) {
			return res.status(404).send({ success: false, message: i18n.t("station.notFound") });
		}

		return res.send({ success: true, data: station });
	},
};

export default getStation;
