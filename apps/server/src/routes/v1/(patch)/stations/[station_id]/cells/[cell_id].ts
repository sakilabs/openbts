import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { cells } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

const cellsUpdateSchema = createUpdateSchema(cells)
	.omit({
		createdAt: true,
		updatedAt: true,
	})
	.strict();
const cellsSelectSchema = createSelectSchema(cells);
type ReqBody = { Body: z.infer<typeof cellsUpdateSchema> };
type ReqParams = { Params: { station_id: number; cell_id: number } };
type RequestData = ReqBody & ReqParams;
type ResponseData = z.infer<typeof cellsSelectSchema>;
const schemaRoute = {
	params: z.object({
		station_id: z.number(),
		cell_id: z.number(),
	}),
	body: cellsUpdateSchema,
	response: {
		200: z.object({
			success: z.boolean(),
			data: cellsSelectSchema,
		}),
	},
};

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { station_id, cell_id } = req.params;
	if (Number.isNaN(station_id) || Number.isNaN(cell_id)) throw new ErrorResponse("INVALID_QUERY");

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.bts_id, station_id),
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	const cell = await db.query.cells.findFirst({
		where: (fields, { and, eq }) => and(eq(fields.id, cell_id), eq(fields.station_id, station.id)),
	});
	if (!cell) throw new ErrorResponse("NOT_FOUND");

	try {
		const updated = await db
			.update(cells)
			.set({
				...req.body,
				updatedAt: new Date(),
			})
			.where(eq(cells.id, cell_id))
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
