import { cells } from "@openbts/drizzle";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { Route, SuccessResponse } from "../../../../../../interfaces/routes.interface.js";

type ReqParams = {
	Params: {
		station_id: number;
		cell_id: number;
	};
};
const schemaRoute = {
	params: z.object({
		station_id: z.number(),
		cell_id: z.number(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
		}),
	},
};

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<SuccessResponse>) {
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
		await db.delete(cells).where(eq(cells.id, cell_id));

		return res.send({
			success: true,
		});
	} catch {
		throw new ErrorResponse("FAILED_TO_DELETE");
	}
}

const deleteCell: Route<ReqParams> = {
	url: "/stations/:station_id/cells/:cell_id",
	method: "DELETE",
	schema: schemaRoute,
	config: { permissions: ["delete:stations", "delete:cells"] },
	handler,
};

export default deleteCell;
