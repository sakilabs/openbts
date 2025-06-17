import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { bands } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { RouteGenericInterface } from "fastify";

type Bands = typeof bands.$inferSelect;
const bandSelectSchema = createSelectSchema(bands);

const schemaRoute = {
	params: z.object({
		id: z.string(),
	}),
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: z.array(bandSelectSchema),
		}),
	}),
};

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<Bands[]>>) {
	const bands = await db.query.bands.findMany();
	return res.send({ success: true, data: bands });
}

const getBands: Route<RouteGenericInterface, Bands[]> = {
	url: "/bands",
	method: "GET",
	config: { permissions: ["read:bands"] },
	schema: schemaRoute,
	handler,
};

export default getBands;
