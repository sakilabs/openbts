import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { stations } from "@openbts/drizzle";

type Station = typeof stations.$inferSelect;

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Station>>) {
	const { id } = req.params;

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.bts_id, Number(id)),
		with: {
			cells: true,
			location: true,
			operator: {
				columns: {
					is_visible: false,
				},
			},
		},
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	return res.send({ success: true, data: station });
}

const getStation: Route<IdParams, Station> = {
	url: "/stations/:id",
	method: "GET",
	config: { permissions: ["read:stations"] },
	handler,
};

export default getStation;
