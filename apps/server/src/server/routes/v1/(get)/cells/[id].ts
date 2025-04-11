import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { cells, stations, bands } from "@openbts/drizzle";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ResponseData = typeof cells.$inferSelect & {
	station: typeof stations.$inferSelect;
	band: typeof bands.$inferSelect;
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;

	const cell = await db.query.cells.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
		with: {
			station: true,
			band: true,
		},
	});
	if (!cell) throw new ErrorResponse("NOT_FOUND");

	return res.send({ success: true, data: cell });
}

const getCell: Route<IdParams, ResponseData> = {
	url: "/cells/:id",
	method: "GET",
	config: { permissions: ["read:cells"] },
	handler,
};

export default getCell;
