import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { bands, cells, gsmCells, lteCells, nrCells, stations, umtsCells } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

const cellsSchema = createSelectSchema(cells).omit({ band_id: true });
const bandsSchema = createSelectSchema(bands);
const gsmCellsSchema = createSelectSchema(gsmCells).omit({ cell_id: true });
const umtsCellsSchema = createSelectSchema(umtsCells).omit({ cell_id: true });
const lteCellsSchema = createSelectSchema(lteCells).omit({ cell_id: true });
const nrCellsSchema = createSelectSchema(nrCells).omit({ cell_id: true });
const cellDetailsSchema = z.union([gsmCellsSchema, umtsCellsSchema, lteCellsSchema, nrCellsSchema]).nullable();
const stationsSchema = createSelectSchema(stations);
type CellBase = z.infer<typeof cellsSchema>;
type CellDetails = z.infer<typeof cellDetailsSchema>;
type CellWithRats = CellBase & {
	station: z.infer<typeof stationsSchema>;
	band: z.infer<typeof bandsSchema>;
	gsm?: z.infer<typeof gsmCellsSchema>;
	umts?: z.infer<typeof umtsCellsSchema>;
	lte?: z.infer<typeof lteCellsSchema>;
	nr?: z.infer<typeof nrCellsSchema>;
};
type Cell = CellBase & { station: z.infer<typeof stationsSchema>; band: z.infer<typeof bandsSchema>; details: CellDetails };
const schemaRoute = {
	params: z.object({
		station_id: z.coerce.number<number>(),
		cell_id: z.coerce.number<number>(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: cellsSchema.extend({ station: stationsSchema, band: bandsSchema, details: cellDetailsSchema }),
		}),
	},
};
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<Cell>>) {
	const { station_id, cell_id } = req.params;

	if (Number.isNaN(station_id) || Number.isNaN(cell_id)) throw new ErrorResponse("INVALID_QUERY");

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.id, station_id),
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	const cell = await db.query.cells.findFirst({
		where: (fields, { eq }) => eq(fields.id, cell_id),
		with: { station: true, band: true, gsm: true, umts: true, lte: true, nr: true },
		columns: { band_id: false },
	});
	if (!cell) throw new ErrorResponse("NOT_FOUND");

	const { gsm, umts, lte, nr, ...rest } = cell as CellWithRats;
	const details: CellDetails = gsm ?? umts ?? lte ?? nr ?? null;
	return res.send({ success: true, data: { ...rest, details } as Cell });
}

const getCellFromStation: Route<ReqParams, Cell> = {
	url: "/stations/:station_id/cells/:cell_id",
	method: "GET",
	config: { permissions: ["read:stations", "read:cells"], allowGuestAccess: true },
	schema: schemaRoute,
	handler,
};

export default getCellFromStation;
