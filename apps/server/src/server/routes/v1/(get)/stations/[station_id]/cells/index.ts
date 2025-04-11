import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";

import type { cells } from "@openbts/drizzle";
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

	if (Number.isNaN(Number(station_id))) throw new ErrorResponse("INVALID_QUERY");

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(station_id)),
		with: {
			cells: true,
		},
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	return res.send({ success: true, data: station.cells });
}

const getCellsFromStation: Route<ReqParams, Cells> = {
	url: "/stations/:station_id/cells",
	method: "GET",
	config: { permissions: ["read:stations", "read:cells"] },
	handler,
};

export default getCellsFromStation;
