import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { regions } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { RouteGenericInterface } from "fastify";

type Region = typeof regions.$inferSelect;
const regionsSchema = createSelectSchema(regions);
const schemaRoute = {
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: z.array(regionsSchema),
		}),
	}),
};

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<Region[]>>) {
	const regions = await db.query.regions.findMany();
	return res.send({ success: true, data: regions });
}

const getRegions: Route<RouteGenericInterface, Region[]> = {
	url: "/regions",
	method: "GET",
	config: { permissions: ["read:regions"] },
	schema: schemaRoute,
	handler,
};

export default getRegions;
