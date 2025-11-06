import { eq, inArray } from "drizzle-orm";
import { cells, stations, gsmCells, umtsCells, lteCells, nrCells } from "@openbts/drizzle";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

const cellsInsertSchema = createInsertSchema(cells)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.strict();
const cellsSelectSchema = createSelectSchema(cells);
const gsmCellsSchema = createSelectSchema(gsmCells).omit({ cell_id: true });
const umtsCellsSchema = createSelectSchema(umtsCells).omit({ cell_id: true });
const lteCellsSchema = createSelectSchema(lteCells).omit({ cell_id: true });
const nrCellsSchema = createSelectSchema(nrCells).omit({ cell_id: true });
const cellDetailsSchema = z.union([gsmCellsSchema, umtsCellsSchema, lteCellsSchema, nrCellsSchema]).nullable();

const gsmInsertSchema = createInsertSchema(gsmCells).omit({ createdAt: true, updatedAt: true });
const umtsInsertSchema = createInsertSchema(umtsCells).omit({ createdAt: true, updatedAt: true });
const lteInsertSchema = createInsertSchema(lteCells).omit({ createdAt: true, updatedAt: true });
const nrInsertSchema = createInsertSchema(nrCells).omit({ createdAt: true, updatedAt: true });
const cellWithDetailsInsert = cellsInsertSchema.extend({
	details: z.union([gsmInsertSchema, umtsInsertSchema, lteInsertSchema, nrInsertSchema]).optional(),
});
const cellWithDetailsSelectSchema = cellsSelectSchema.extend({ details: cellDetailsSchema });

const schemaRoute = {
	params: z.object({
		station_id: z.coerce.number<number>(),
	}),
	body: z.object({
		cells: z.array(cellWithDetailsInsert),
	}),
	response: {
		200: z.object({
			data: z.array(cellWithDetailsSelectSchema),
		}),
	},
};
type ReqBody = {
	Body: { cells: z.infer<typeof cellWithDetailsInsert>[] };
};
type ReqParams = {
	Params: z.infer<typeof schemaRoute.params>;
};
type RequestData = ReqParams & ReqBody;
type ResponseData = z.infer<typeof cellWithDetailsSelectSchema>[];

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { station_id } = req.params;
	const { cells: cellsData } = req.body;

	if (!cellsData || cellsData.length === 0) throw new ErrorResponse("INVALID_QUERY");

	const station = await db.query.stations.findFirst({
		where: eq(stations.id, station_id),
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	try {
		const created = await db
			.insert(cells)
			.values(
				cellsData.map((cell) => ({
					...cell,
					station_id: station.id,
					updatedAt: new Date(),
					createdAt: new Date(),
				})),
			)
			.returning();

		await Promise.all(
			created.map(async (row, idx) => {
				const details = cellsData[idx]?.details;
				if (!details) return;
				switch (row.rat) {
					case "GSM":
						await db.insert(gsmCells).values({ ...(details as z.infer<typeof gsmInsertSchema>), cell_id: row.id });
						break;
					case "UMTS":
						await db.insert(umtsCells).values({ ...(details as z.infer<typeof umtsInsertSchema>), cell_id: row.id });
						break;
					case "LTE":
						await db.insert(lteCells).values({ ...(details as z.infer<typeof lteInsertSchema>), cell_id: row.id });
						break;
					case "NR":
						await db.insert(nrCells).values({ ...(details as z.infer<typeof nrInsertSchema>), cell_id: row.id });
						break;
				}
			}),
		);

		const ids = created.map((cell) => cell.id);
		const full = await db.query.cells.findMany({
			where: inArray(cells.id, ids),
			with: { gsm: true, umts: true, lte: true, nr: true },
		});
		const idToDetails = new Map<number, z.infer<typeof cellDetailsSchema>>();
		for (const c of full) {
			const details: z.infer<typeof cellDetailsSchema> =
				(c.gsm ? (({ cell_id, ...rest }) => rest)(c.gsm) : null) ??
				(c.umts ? (({ cell_id, ...rest }) => rest)(c.umts) : null) ??
				(c.lte ? (({ cell_id, ...rest }) => rest)(c.lte) : null) ??
				(c.nr ? (({ cell_id, ...rest }) => rest)(c.nr) : null) ??
				null;
			idToDetails.set(c.id, details);
		}

		const response: ResponseData = created.map((cell) => ({ ...cell, details: idToDetails.get(cell.id) ?? null }));

		return res.send({ data: response });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("FAILED_TO_CREATE");
	}
}

const addCells: Route<RequestData, ResponseData> = {
	url: "/stations/:station_id/cells",
	method: "POST",
	config: { permissions: ["write:stations"] },
	schema: schemaRoute,
	handler,
};

export default addCells;
