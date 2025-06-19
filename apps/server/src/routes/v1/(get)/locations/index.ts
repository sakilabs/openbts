import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { locations, regions } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { RouteGenericInterface } from "fastify";

type ResponseData = typeof locations.$inferSelect & { region: typeof regions.$inferSelect };
const locationsSchema = createSelectSchema(locations);
const regionsSchema = createSelectSchema(regions);
const schemaRoute = {
	params: z.object({
		id: z.number(),
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

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData[]>>) {
	const locations = await db.query.locations.findMany({
		with: {
			region: true,
		},
	});
	return res.send({ success: true, data: locations });
}

const getLocations: Route<RouteGenericInterface, ResponseData[]> = {
	url: "/locations",
	method: "GET",
	config: { permissions: ["read:locations"] },
	schema: schemaRoute,
	handler,
};

export default getLocations;
