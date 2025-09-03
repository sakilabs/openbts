import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { locations, regions } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const locationsSchema = createSelectSchema(locations).omit({ point: true, region_id: true });
const regionsSchema = createSelectSchema(regions);
const schemaRoute = {
	params: z.object({
		id: z.coerce.number<number>(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: locationsSchema.extend({
				region: regionsSchema,
			}),
		}),
	},
};
type ResponseData = z.infer<typeof locationsSchema> & { region: z.infer<typeof regionsSchema> };

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;

	const location = await db.query.locations.findFirst({
		where: (fields, { eq }) => eq(fields.id, id),
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
	config: { permissions: ["read:locations"], allowGuestAccess: true },
	schema: schemaRoute,
	handler,
};

export default getLocation;
