import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { cells } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof cells.$inferInsert };
type ReqParams = { Params: { station_id: string; cell_id: string } };
type RequestData = ReqBody & ReqParams;
type ResponseData = typeof cells.$inferSelect;
const cellsUpdateSchema = createUpdateSchema(cells).strict();
const cellsSelectSchema = createSelectSchema(cells);
const schemaRoute = {
	params: z.object({
		station_id: z.string(),
		cell_id: z.string(),
	}),
	body: cellsUpdateSchema,
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: cellsSelectSchema,
		}),
	}),
};

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { station_id, cell_id } = req.params;
	const stationId = Number(station_id);
	const cellId = Number(cell_id);

	if (Number.isNaN(stationId) || Number.isNaN(cellId)) throw new ErrorResponse("INVALID_QUERY");

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.bts_id, stationId),
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	const cell = await db.query.cells.findFirst({
		where: (fields, { and, eq }) => and(eq(fields.id, cellId), eq(fields.station_id, station.id)),
	});
	if (!cell) throw new ErrorResponse("NOT_FOUND");

	try {
		const updated = await db
			.update(cells)
			.set({
				...req.body,
				last_updated: new Date(),
			})
			.where(eq(cells.id, cellId))
			.returning();

		return res.send({
			success: true,
			data: updated[0],
		});
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("FAILED_TO_UPDATE");
	}
}

const updateCell: Route<RequestData, ResponseData> = {
	url: "/stations/:station_id/cells/:cell_id",
	method: "PATCH",
	schema: schemaRoute,
	config: { permissions: ["write:stations"] },
	handler,
};

export default updateCell;
