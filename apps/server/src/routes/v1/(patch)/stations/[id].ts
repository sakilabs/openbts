import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { stations } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const stationsUpdateSchema = createUpdateSchema(stations)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.strict();
const stationsSelectSchema = createSelectSchema(stations);
const schemaRoute = {
	params: z.object({
		station_id: z.coerce.number<number>(),
	}),
	body: stationsUpdateSchema,
	response: {
		200: z.object({
			data: stationsSelectSchema,
		}),
	},
};
type ReqBody = { Body: z.infer<typeof stationsUpdateSchema> };
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type RequestData = ReqBody & ReqParams;
type ResponseData = z.infer<typeof stationsSelectSchema>;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { station_id } = req.params;

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.id, station_id),
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	try {
		const [updated] = await db
			.update(stations)
			.set({
				...req.body,
				updatedAt: new Date(),
			})
			.where(eq(stations.id, station_id))
			.returning();
		if (!updated) throw new ErrorResponse("FAILED_TO_UPDATE");

		return res.send({ data: updated });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("FAILED_TO_UPDATE");
	}
}

const updateStation: Route<RequestData, ResponseData> = {
	url: "/stations/:station_id",
	method: "PATCH",
	config: { permissions: ["write:stations"] },
	schema: schemaRoute,
	handler,
};

export default updateStation;
