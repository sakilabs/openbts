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
type ReqBody = { Body: z.infer<typeof stationsUpdateSchema> };
type ReqParams = { Params: { station_id: number } };
type RequestData = ReqBody & ReqParams;
type ResponseData = z.infer<typeof stationsSelectSchema>;
const schemaRoute = {
	params: z.object({
		station_id: z.number(),
	}),
	body: stationsUpdateSchema,
	response: {
		200: z.object({
			success: z.boolean(),
			data: stationsSelectSchema,
		}),
	},
};

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { station_id } = req.params;

	try {
		const station = await db
			.update(stations)
			.set({
				...req.body,
				updatedAt: new Date(),
			})
			.where(eq(stations.id, station_id))
			.returning();
		if (!station.length) throw new ErrorResponse("NOT_FOUND");

		return res.send({ success: true, data: station[0] });
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
