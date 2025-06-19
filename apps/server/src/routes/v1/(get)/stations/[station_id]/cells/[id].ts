import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { cells, stations } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

const cellsSchema = createSelectSchema(cells);
const stationsSchema = createSelectSchema(stations);
type Cell = z.infer<typeof cellsSchema> & {
	station: z.infer<typeof stationsSchema>;
};
type ReqParams = {
	Params: {
		station_id: number;
		cell_id: number;
	};
};
const schemaRoute = {
	params: z.object({
		station_id: z.number(),
		cell_id: z.number(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: cellsSchema.extend({
				station: stationsSchema,
			}),
		}),
	},
};

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<Cell>>) {
	const { station_id, cell_id } = req.params;

	if (Number.isNaN(station_id) || Number.isNaN(cell_id)) throw new ErrorResponse("INVALID_QUERY");

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.id, station_id),
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	const cell = await db.query.cells.findFirst({
		where: (fields, { eq }) => eq(fields.id, cell_id),
		with: {
			station: true,
		},
	});
	if (!cell) throw new ErrorResponse("NOT_FOUND");

	return res.send({ success: true, data: cell });
}

const getCellFromStation: Route<ReqParams, Cell> = {
	url: "/stations/:station_id/cells/:cell_id",
	method: "GET",
	config: { permissions: ["read:stations", "read:cells"] },
	schema: schemaRoute,
	handler,
};

export default getCellFromStation;
