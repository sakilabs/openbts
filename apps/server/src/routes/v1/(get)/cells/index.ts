import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { cells, stations, bands } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { RouteGenericInterface } from "fastify";

const cellsSchema = createSelectSchema(cells);
const stationsSchema = createSelectSchema(stations);
const bandsSchema = createSelectSchema(bands);
const schemaRoute = {
	params: z.object({
		id: z.number(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: cellsSchema.extend({
				station: stationsSchema,
				band: bandsSchema,
			}),
		}),
	},
};
type ResponseData = z.infer<typeof cellsSchema> & {
	station: z.infer<typeof stationsSchema>;
	band: z.infer<typeof bandsSchema>;
};

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData[]>>) {
	const cells = await db.query.cells.findMany({
		with: {
			station: true,
			band: true,
		},
	});

	return res.send({ success: true, data: cells });
}

const getCells: Route<RouteGenericInterface, ResponseData[]> = {
	url: "/cells",
	method: "GET",
	config: { permissions: ["read:cells"] },
	schema: schemaRoute,
	handler,
};

export default getCells;
