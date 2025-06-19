import { eq } from "drizzle-orm";
import { stations } from "@openbts/drizzle";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, SuccessResponse, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
	params: z.object({
		id: z.number(),
	}),
	response: z.object({
		200: z.object({
			success: z.boolean(),
		}),
	}),
};
async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<SuccessResponse>) {
	const { id: stationId } = req.params;

	if (Number.isNaN(stationId)) throw new ErrorResponse("INVALID_QUERY");

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.bts_id, stationId),
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	try {
		await db.delete(stations).where(eq(stations.bts_id, stationId));

		return res.send({
			success: true,
		});
	} catch {
		throw new ErrorResponse("FAILED_TO_DELETE");
	}
}

const deleteStation: Route<IdParams> = {
	url: "/stations/:id",
	method: "DELETE",
	schema: schemaRoute,
	config: { permissions: ["delete:stations"] },
	handler,
};

export default deleteStation;
