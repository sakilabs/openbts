import { eq } from "drizzle-orm/pg-core/expressions";

import db from "../../../../../../database/psql.js";
import { i18n } from "../../../../../../i18n/index.js";
import { type cells, stations } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

type Cells = (typeof cells.$inferSelect)[];
type ReqParams = {
	Params: {
		station_id: string;
	};
};

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<Cells>>) {
	const { station_id } = req.params;

	if (Number.isNaN(Number(station_id))) return res.status(400).send({ success: false, message: i18n.t("station.invalidId") });

	const station = await db.query.stations.findFirst({
		where: eq(stations.id, Number(station_id)),
		with: {
			cells: true,
		},
	});
	if (!station) return res.status(404).send({ success: false, message: i18n.t("station.notFound") });

	return res.send({ success: true, data: station.cells });
}

const getCellsFromStation: Route<ReqParams, Cells> = {
	url: "/stations/:station_id/cells",
	method: "GET",
	config: { permissions: ["read:stations", "read:cells"] },
	handler,
};

export default getCellsFromStation;
