import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { cells } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

const cellsSchema = createSelectSchema(cells);
type Cells = z.infer<typeof cellsSchema>[];
type ReqParams = {
	Params: {
		station_id: number;
	};
};
const schemaRoute = {
	params: z.object({
		station_id: z.number(),
	}),
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: z.array(cellsSchema),
		}),
	}),
};

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<Cells>>) {
	const { station_id } = req.params;
	if (Number.isNaN(station_id)) throw new ErrorResponse("INVALID_QUERY");

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.id, station_id),
		with: {
			cells: true,
		},
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	return res.send({ success: true, data: station.cells });
}

const getCellsFromStation: Route<ReqParams, Cells> = {
	url: "/stations/:station_id/cells",
	method: "GET",
	config: { permissions: ["read:stations", "read:cells"] },
	schema: schemaRoute,
	handler,
};

export default getCellsFromStation;
