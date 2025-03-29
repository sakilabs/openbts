import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { stations } from "@openbts/drizzle";

type Station = typeof stations.$inferSelect;

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Station>>) {
	const { id } = req.params;

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.bts_id, Number(id)),
	});
	if (!station) return res.status(404).send({ success: false, message: i18n.t("station.notFound") });

	return res.send({ success: true, data: station });
}

const getStation: Route<IdParams, Station> = {
	url: "/stations/:id",
	method: "GET",
	config: { permissions: ["read:stations"] },
	handler,
};

export default getStation;
