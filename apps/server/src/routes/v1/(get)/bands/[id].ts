import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import { bands } from "@openbts/drizzle";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const bandSelectSchema = createSelectSchema(bands);
type Band = z.infer<typeof bandSelectSchema>;

const schemaRoute = {
	params: z.object({
		id: z.number(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: bandSelectSchema,
		}),
	},
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Band>>) {
	const { id } = req.params;
	const band = await db.query.bands.findFirst({
		where: (fields, { eq }) => eq(fields.id, id),
	});
	if (!band) throw new ErrorResponse("NOT_FOUND");

	return res.send({ success: true, data: band });
}

const getBand: Route<IdParams, Band> = {
	url: "/bands/:id",
	method: "GET",
	config: { permissions: ["read:bands"] },
	schema: schemaRoute,
	handler,
};

export default getBand;
