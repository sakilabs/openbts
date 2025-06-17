import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { cells, locations, operators, stations } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type Station = typeof stations.$inferSelect;
const stationSchema = createSelectSchema(stations);
const cellsSchema = createSelectSchema(cells);
const locationSchema = createSelectSchema(locations);
const operatorSchema = createSelectSchema(operators).omit({ is_visible: true });
const schemaRoute = {
	params: z.object({
		id: z.string(),
	}),
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: stationSchema.extend({
				cells: z.array(cellsSchema),
				location: locationSchema,
				operator: operatorSchema,
			}),
		}),
	}),
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Station>>) {
	const { id } = req.params;

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.bts_id, Number(id)),
		with: {
			cells: true,
			location: true,
			operator: {
				columns: {
					is_visible: false,
				},
			},
		},
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	return res.send({ success: true, data: station });
}

const getStation: Route<IdParams, Station> = {
	url: "/stations/:id",
	method: "GET",
	config: { permissions: ["read:stations"] },
	schema: schemaRoute,
	handler,
};

export default getStation;
