import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { bands } from "@openbts/drizzle";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type Band = typeof bands.$inferSelect;

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Band>>) {
	const { id } = req.params;
	const band = await db.query.bands.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
	});

	if (!band) throw new ErrorResponse("NOT_FOUND");

	return res.send({ success: true, data: band });
}

const getBand: Route<IdParams, Band> = {
	url: "/bands/:id",
	method: "GET",
	config: { permissions: ["read:bands"] },
	handler,
};

export default getBand;
