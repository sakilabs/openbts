import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { locations, regions } from "@openbts/drizzle";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ResponseData = typeof locations.$inferSelect & { region: typeof regions.$inferSelect };

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;

	const location = await db.query.locations.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
		with: {
			region: true,
		},
	});
	if (!location) throw new ErrorResponse("NOT_FOUND");

	return res.send({ success: true, data: location });
}

const getLocation: Route<IdParams, ResponseData> = {
	url: "/locations/:id",
	method: "GET",
	config: { permissions: ["read:locations"] },
	handler,
};

export default getLocation;
