import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { getRuntimeSettings } from "../../../../../../services/settings.service.js";
import { stationComments } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

const stationCommentSelectSchema = createSelectSchema(stationComments);

const schemaRoute = {
	params: z.object({
		station_id: z.coerce.number<number>(),
	}),
	response: {
		200: z.object({
			data: z.array(stationCommentSelectSchema),
		}),
	},
};

type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type ResponseData = z.infer<typeof stationCommentSelectSchema>[];

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { station_id } = req.params;

	if (!getRuntimeSettings().enableStationComments) throw new ErrorResponse("FORBIDDEN");

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.id, station_id),
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	try {
		const comments = await db.query.stationComments.findMany({
			where: (fields, { eq }) => eq(fields.station_id, station_id),
			with: {
				author: true,
			},
			orderBy: (fields, { desc }) => [desc(fields.createdAt)],
		});

		return res.send({ data: comments });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const getStationComments: Route<ReqParams, ResponseData> = {
	url: "/stations/:station_id/comments",
	method: "GET",
	config: { permissions: ["read:stations", "read:comments"], allowGuestAccess: true },
	schema: schemaRoute,
	handler,
};

export default getStationComments;
