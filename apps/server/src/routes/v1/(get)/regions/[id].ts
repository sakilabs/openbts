import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { regions } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type Region = typeof regions.$inferSelect;
const regionsSchema = createSelectSchema(regions);
const schemaRoute = {
	params: z.object({
		id: z.number(),
	}),
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: regionsSchema,
		}),
	}),
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Region>>) {
	const { id } = req.params;

	const region = await db.query.regions.findFirst({
		where: (fields, { eq }) => eq(fields.id, id),
	});
	if (!region) throw new ErrorResponse("NOT_FOUND");

	return res.send({ success: true, data: region });
}

const getRegion: Route<IdParams, Region> = {
	url: "/regions/:id",
	method: "GET",
	config: { permissions: ["read:regions"] },
	schema: schemaRoute,
	handler,
};

export default getRegion;
