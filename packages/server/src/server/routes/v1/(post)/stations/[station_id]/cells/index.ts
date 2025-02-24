import db from "../../../../../../database/psql.js";
import { i18n } from "../../../../../../i18n/index.js";
import { cells, stations } from "@openbts/drizzle";
import { eq } from "drizzle-orm";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

type ReqBody = {
	Body: { cells: (typeof cells.$inferInsert)[] };
};
type ReqParams = {
	Params: {
		station_id: string;
	};
};
type RequestData = ReqParams & ReqBody;
type ResponseData = (typeof cells.$inferSelect)[];

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { station_id } = req.params;
	const { cells: cellsData } = req.body;

	if (!cellsData || cellsData.length === 0) {
		return res.status(400).send({
			success: false,
			error: "Cells array is required and cannot be empty",
		});
	}

	const station = await db.query.stations.findFirst({
		where: eq(stations.station_id, station_id),
	});
	if (!station) {
		return res.status(404).send({
			success: false,
			error: "Station not found",
		});
	}

	const newCells = await db
		.insert(cells)
		.values(
			cellsData.map((cell) => ({
				...cell,
				station_id: station.id,
				last_updated: new Date(),
				date_created: new Date(),
			})),
		)
		.returning();

	return res.send({ success: true, data: newCells });
}

const addCells: Route<RequestData, ResponseData> = {
	url: "/stations/:station_id/cells",
	method: "POST",
	config: { permissions: ["write:stations"] },
	handler,
};

export default addCells;
