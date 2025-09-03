import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { bands, cells, gsmCells, locations, lteCells, nrCells, operators, regions, stations, umtsCells } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const stationSchema = createSelectSchema(stations).omit({ status: true });
const cellsSchema = createSelectSchema(cells).omit({ band_id: true });
const bandsSchema = createSelectSchema(bands);
const regionSchema = createSelectSchema(regions);
const gsmCellsSchema = createSelectSchema(gsmCells).omit({ cell_id: true });
const umtsCellsSchema = createSelectSchema(umtsCells).omit({ cell_id: true });
const lteCellsSchema = createSelectSchema(lteCells).omit({ cell_id: true });
const nrCellsSchema = createSelectSchema(nrCells).omit({ cell_id: true });
const cellDetailsSchema = z.union([gsmCellsSchema, umtsCellsSchema, lteCellsSchema, nrCellsSchema]).nullable();
const locationSchema = createSelectSchema(locations).omit({ point: true, region_id: true });
const operatorSchema = createSelectSchema(operators).omit({ is_isp: true });
type StationBase = z.infer<typeof stationSchema>;
type CellDetails = z.infer<typeof cellDetailsSchema>;
type CellWithRats = z.infer<typeof cellsSchema> & {
	band: z.infer<typeof bandsSchema>;
	gsm?: z.infer<typeof gsmCellsSchema>;
	umts?: z.infer<typeof umtsCellsSchema>;
	lte?: z.infer<typeof lteCellsSchema>;
	nr?: z.infer<typeof nrCellsSchema>;
};
type CellResponse = z.infer<typeof cellsSchema> & { band: z.infer<typeof bandsSchema>; details: CellDetails };
type StationResponse = StationBase & {
	cells: CellResponse[];
	location: z.infer<typeof locationSchema>;
	operator: z.infer<typeof operatorSchema>;
};
const schemaRoute = {
	params: z.object({
		id: z.coerce.number<number>(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: stationSchema.extend({
				cells: z.array(cellsSchema.extend({ band: bandsSchema, details: cellDetailsSchema })),
				location: locationSchema.extend({ region: regionSchema }),
				operator: operatorSchema,
			}),
		}),
	},
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<StationResponse>>) {
	const { id } = req.params;

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.id, id),
		with: {
			cells: { with: { band: true, gsm: true, umts: true, lte: true, nr: true }, columns: { band_id: false } },
			location: { columns: { point: false, region_id: false }, with: { region: true } },
			operator: true,
		},
		columns: { status: false },
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	const cells: CellResponse[] = (station.cells as CellWithRats[]).map((cell: CellWithRats) => {
		const { gsm, umts, lte, nr, band, ...rest } = cell;
		const details: CellDetails = gsm ?? umts ?? lte ?? nr ?? null;
		return { ...rest, band, details };
	});

	return res.send({ success: true, data: { ...station, cells } as StationResponse });
}

const getStation: Route<IdParams, StationResponse> = {
	url: "/stations/:id",
	method: "GET",
	config: { permissions: ["read:stations"], allowGuestAccess: true },
	schema: schemaRoute,
	handler,
};

export default getStation;
