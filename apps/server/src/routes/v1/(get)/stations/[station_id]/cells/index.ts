import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { cells, gsmCells, umtsCells, lteCells, nrCells, bands } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

const cellsSchema = createSelectSchema(cells).omit({ band_id: true });
const bandSchema = createSelectSchema(bands);
const gsmCellsSchema = createSelectSchema(gsmCells).omit({ cell_id: true });
const umtsCellsSchema = createSelectSchema(umtsCells).omit({ cell_id: true });
const lteCellsSchema = createSelectSchema(lteCells).omit({ cell_id: true });
const nrCellsSchema = createSelectSchema(nrCells).omit({ cell_id: true });
const cellDetailsSchema = z.union([gsmCellsSchema, umtsCellsSchema, lteCellsSchema, nrCellsSchema]).nullable();
type Cells = z.infer<typeof cellsSchema>[];
const schemaRoute = {
	params: z.object({
		station_id: z.coerce.number<number>(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: z.array(cellsSchema.extend({ details: cellDetailsSchema, band: bandSchema })),
		}),
	},
};
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };

type CellWithRats = z.infer<typeof cellsSchema> & {
	gsm?: z.infer<typeof gsmCellsSchema>;
	umts?: z.infer<typeof umtsCellsSchema>;
	lte?: z.infer<typeof lteCellsSchema>;
	nr?: z.infer<typeof nrCellsSchema>;
};

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<Cells>>) {
	const { station_id } = req.params;
	if (Number.isNaN(station_id)) throw new ErrorResponse("INVALID_QUERY");

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.id, station_id),
		with: {
			cells: { with: { gsm: true, umts: true, lte: true, nr: true, band: true } },
		},
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	const data = (station.cells as CellWithRats[]).map((cell) => {
		const { gsm, umts, lte, nr, ...rest } = cell;
		return { ...rest, details: gsm ?? umts ?? lte ?? nr ?? null };
	});

	return res.send({ success: true, data });
}

const getCellsFromStation: Route<ReqParams, Cells> = {
	url: "/stations/:station_id/cells",
	method: "GET",
	config: { permissions: ["read:stations", "read:cells"], allowGuestAccess: true },
	schema: schemaRoute,
	handler,
};

export default getCellsFromStation;
