import db from "../../../../../../database/psql.js";
import { i18n } from "../../../../../../i18n/index.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";
import { cells, type stations } from "@openbts/drizzle";
import { eq } from "drizzle-orm/pg-core/expressions";

type Cell = typeof cells.$inferSelect & {
	station: typeof stations.$inferSelect;
};
type ReqParams = {
	Params: {
		station_id: string;
		cell_id: string;
	};
};

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<Cell>>) {
	const { station_id, cell_id } = req.params;

	if (Number.isNaN(Number(station_id)) || Number.isNaN(Number(cell_id)))
		return res.status(400).send({ success: false, message: i18n.t("station.invalidId") });

	const cell = await db.query.cells.findFirst({
		where: eq(cells.id, Number(cell_id)),
		with: {
			station: true,
		},
	});
	if (!cell) return res.status(404).send({ success: false, message: i18n.t("cell.notFound") });

	return res.send({ success: true, data: cell });
}

const getCellFromStation: Route<ReqParams, Cell> = {
	url: "/stations/:station_id/cells/:cell_id",
	method: "GET",
	config: { permissions: ["read:stations", "read:cells"] },
	handler,
};

export default getCellFromStation;
