import { bands, locations, operators, stations, cells, gsmCells, umtsCells, lteCells, nrCells } from "@openbts/drizzle";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const stationsInsertSchema = createInsertSchema(stations);
const stationSchema = createSelectSchema(stations).omit({ status: true });
const cellsSchema = createSelectSchema(cells).omit({ band_id: true });
const bandsSchema = createSelectSchema(bands);
const gsmCellsSchema = createSelectSchema(gsmCells).omit({ cell_id: true });
const umtsCellsSchema = createSelectSchema(umtsCells).omit({ cell_id: true });
const lteCellsSchema = createSelectSchema(lteCells).omit({ cell_id: true });
const nrCellsSchema = createSelectSchema(nrCells).omit({ cell_id: true });
const cellDetailsSchema = z.union([gsmCellsSchema, umtsCellsSchema, lteCellsSchema, nrCellsSchema]).nullable();
const locationSchema = createSelectSchema(locations).omit({ point: true });
const operatorSchema = createSelectSchema(operators);
const baseCellsInsertSchema = createInsertSchema(cells).omit({ createdAt: true, updatedAt: true }).strict();
const gsmInsertSchema = createInsertSchema(gsmCells).omit({ createdAt: true, updatedAt: true });
const umtsInsertSchema = createInsertSchema(umtsCells).omit({ createdAt: true, updatedAt: true });
const lteInsertSchema = createInsertSchema(lteCells).omit({ createdAt: true, updatedAt: true });
const nrInsertSchema = createInsertSchema(nrCells).omit({ createdAt: true, updatedAt: true });
const cellWithDetailsInsert = baseCellsInsertSchema.extend({
	details: z.union([gsmInsertSchema, umtsInsertSchema, lteInsertSchema, nrInsertSchema]).optional(),
});

type ReqBody = {
	Body: z.infer<typeof stationsInsertSchema> & { cells: z.infer<typeof cellWithDetailsInsert>[] };
};
type CellResponse = z.infer<typeof cellsSchema> & { band: z.infer<typeof bandsSchema>; details: z.infer<typeof cellDetailsSchema> };
type ResponseData = z.infer<typeof stationSchema> & {
	cells: CellResponse[];
	location: z.infer<typeof locationSchema>;
	operator: z.infer<typeof operatorSchema>;
};
const schemaRoute = {
	body: stationsInsertSchema.extend({
		cells: z.array(cellWithDetailsInsert),
	}),
	response: {
		200: z.object({
			data: stationSchema.extend({
				cells: z.array(cellsSchema.extend({ band: bandsSchema, details: cellDetailsSchema })),
				location: locationSchema,
				operator: operatorSchema,
			}),
		}),
	},
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { cells: cellsData, ...stationData } = req.body;

	try {
		const station = await db.transaction(async (tx) => {
			const [newStation] = await tx
				.insert(stations)
				.values({
					...stationData,
					updatedAt: new Date(),
					createdAt: new Date(),
				})
				.returning();

			if (!newStation) {
				tx.rollback();
				throw new ErrorResponse("FAILED_TO_CREATE");
			}

			if (cellsData && cellsData?.length > 0) {
				const createdCells = await tx
					.insert(cells)
					.values(
						cellsData.map((cell) => ({
							...cell,
							station_id: newStation.id,
							updatedAt: new Date(),
							createdAt: new Date(),
						})),
					)
					.returning();

				await Promise.all(
					createdCells.map(async (row, idx) => {
						const details = cellsData[idx]?.details;
						if (!details) return;
						switch (row.rat) {
							case "GSM":
								await tx.insert(gsmCells).values({ ...(details as z.infer<typeof gsmInsertSchema>), cell_id: row.id });
								break;
							case "UMTS":
								await tx.insert(umtsCells).values({ ...(details as z.infer<typeof umtsInsertSchema>), cell_id: row.id });
								break;
							case "LTE":
								await tx.insert(lteCells).values({ ...(details as z.infer<typeof lteInsertSchema>), cell_id: row.id });
								break;
							case "NR":
								await tx.insert(nrCells).values({ ...(details as z.infer<typeof nrInsertSchema>), cell_id: row.id });
								break;
						}
					}),
				);
			}

			const full = await tx.query.stations.findFirst({
				where: (fields, { eq }) => eq(fields.id, newStation.id),
				with: {
					cells: { with: { band: true, gsm: true, umts: true, lte: true, nr: true }, columns: { band_id: false } },
					location: { columns: { point: false } },
					operator: true,
				},
				columns: { status: false },
			});
			if (!full) {
				tx.rollback();
				throw new ErrorResponse("NOT_FOUND");
			}

			const cellsWithDetails = (
				full.cells as Array<
					z.infer<typeof cellsSchema> & {
						band: z.infer<typeof bandsSchema>;
						gsm?: z.infer<typeof gsmCellsSchema>;
						umts?: z.infer<typeof umtsCellsSchema>;
						lte?: z.infer<typeof lteCellsSchema>;
						nr?: z.infer<typeof nrCellsSchema>;
					}
				>
			).map((cell) => {
				const { gsm, umts, lte, nr, band, ...rest } = cell;
				const details: z.infer<typeof cellDetailsSchema> = gsm ?? umts ?? lte ?? nr ?? null;
				return { ...rest, band, details } as CellResponse;
			});

			const response: ResponseData = { ...full, cells: cellsWithDetails } as ResponseData;
			return response;
		});

		return res.send({ data: station });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("FAILED_TO_CREATE");
	}
}

const createStation: Route<ReqBody, ResponseData> = {
	url: "/stations",
	method: "POST",
	config: { permissions: ["write:stations"] },
	schema: schemaRoute,
	handler,
};

export default createStation;
