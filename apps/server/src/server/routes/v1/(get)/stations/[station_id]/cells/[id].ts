import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";
import type { cells, stations } from "@openbts/drizzle";

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

	if (Number.isNaN(Number(station_id)) || Number.isNaN(Number(cell_id))) throw new ErrorResponse("INVALID_QUERY");

	const cell = await db.query.cells.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(cell_id)),
		with: {
			station: true,
		},
	});
	if (!cell) throw new ErrorResponse("NOT_FOUND");

	return res.send({ success: true, data: cell });
}

const getCellFromStation: Route<ReqParams, Cell> = {
	url: "/stations/:station_id/cells/:cell_id",
	method: "GET",
	config: { permissions: ["read:stations", "read:cells"] },
	handler,
};

export default getCellFromStation;
