import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { cells, stations, bands, gsmCells, umtsCells, lteCells, nrCells } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { RouteGenericInterface } from "fastify";

const cellsSchema = createSelectSchema(cells);
const stationsSchema = createSelectSchema(stations);
const bandsSchema = createSelectSchema(bands);
const gsmCellsSchema = createSelectSchema(gsmCells).omit({ cell_id: true });
const umtsCellsSchema = createSelectSchema(umtsCells).omit({ cell_id: true });
const lteCellsSchema = createSelectSchema(lteCells).omit({ cell_id: true });
const nrCellsSchema = createSelectSchema(nrCells).omit({ cell_id: true });
const cellDetailsSchema = z.union([gsmCellsSchema, umtsCellsSchema, lteCellsSchema, nrCellsSchema]).nullable();
const cellResponseSchema = cellsSchema.extend({
	station: stationsSchema,
	band: bandsSchema,
	details: cellDetailsSchema,
});
const schemaRoute = {
	params: z.object({
		id: z.number(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: z.array(cellResponseSchema),
		}),
	},
};
type ResponseData = z.infer<typeof cellResponseSchema>[];

type CellWithRat = z.infer<typeof cellsSchema> & {
	station: z.infer<typeof stationsSchema>;
	band: z.infer<typeof bandsSchema>;
	gsm?: z.infer<typeof gsmCellsSchema> | null;
	umts?: z.infer<typeof umtsCellsSchema> | null;
	lte?: z.infer<typeof lteCellsSchema> | null;
	nr?: z.infer<typeof nrCellsSchema> | null;
};

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData>>) {
	const rows = await db.query.cells.findMany({
		with: {
			station: true,
			band: true,
			gsm: true,
			umts: true,
			lte: true,
			nr: true,
		},
	});

	const data: ResponseData = rows.map((cell: CellWithRat) => {
		const { gsm, umts, lte, nr, ...rest } = cell;
		return {
			...rest,
			details: gsm ?? umts ?? lte ?? nr ?? null,
		};
	});

	return res.send({ success: true, data });
}

const getCells: Route<RouteGenericInterface, ResponseData> = {
	url: "/cells",
	method: "GET",
	config: { permissions: ["read:cells"] },
	schema: schemaRoute,
	handler,
};

export default getCells;
