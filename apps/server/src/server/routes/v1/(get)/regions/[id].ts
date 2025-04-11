import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { regions } from "@openbts/drizzle";

type Region = typeof regions.$inferSelect;

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Region>>) {
	const { id } = req.params;

	const region = await db.query.regions.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
	});
	if (!region) throw new ErrorResponse("NOT_FOUND");

	return res.send({ success: true, data: region });
}

const getRegion: Route<IdParams, Region> = {
	url: "/regions/:id",
	method: "GET",
	config: { permissions: ["read:regions"] },
	handler,
};

export default getRegion;
