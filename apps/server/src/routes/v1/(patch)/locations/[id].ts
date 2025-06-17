import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { locations } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof locations.$inferInsert };
type ReqParams = { Params: { location_id: string } };
type RequestData = ReqBody & ReqParams;
type ResponseData = typeof locations.$inferSelect;
const locationsUpdateSchema = createUpdateSchema(locations).strict();
const locationsSelectSchema = createSelectSchema(locations);
const schemaRoute = {
	params: z.object({
		location_id: z.string(),
	}),
	body: locationsUpdateSchema,
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: locationsSelectSchema,
		}),
	}),
};

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { location_id } = req.params;
	const locationId = Number(location_id);

	if (Number.isNaN(locationId)) throw new ErrorResponse("INVALID_QUERY");

	const location = await db.query.locations.findFirst({
		where: (fields, { eq }) => eq(fields.id, locationId),
	});
	if (!location) throw new ErrorResponse("NOT_FOUND");

	try {
		const updated = await db.update(locations).set(req.body).where(eq(locations.id, locationId)).returning();

		return res.send({
			success: true,
			data: updated[0],
		});
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("FAILED_TO_UPDATE");
	}
}

const updateLocation: Route<RequestData, ResponseData> = {
	url: "/locations/:location_id",
	method: "PATCH",
	schema: schemaRoute,
	config: { permissions: ["write:locations"] },
	handler,
};

export default updateLocation;
