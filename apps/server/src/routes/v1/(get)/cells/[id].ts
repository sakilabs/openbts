import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { cells, stations, bands } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

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

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;

	const cell = await db.query.cells.findFirst({
		where: (fields, { eq }) => eq(fields.id, id),
		with: {
			station: true,
			band: true,
		},
	});
	if (!cell) throw new ErrorResponse("NOT_FOUND");

	return res.send({ success: true, data: cell });
}

const getCell: Route<IdParams, ResponseData> = {
	url: "/cells/:id",
	method: "GET",
	config: { permissions: ["read:cells"] },
	schema: schemaRoute,
	handler,
};

export default getCell;
