import { cells } from "@openbts/drizzle";
import { eq } from "drizzle-orm";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

type ReqParams = {
	Params: {
		station_id: string;
		cell_id: string;
	};
};

const schemaRoute = {
	params: {
		type: "object",
		properties: {
			station_id: { type: "string" },
			cell_id: { type: "string" },
		},
		required: ["station_id", "cell_id"],
	},
	response: {
		200: {
			type: "object",
			properties: {
				success: { type: "boolean" },
			},
		},
		// 404: {
		// 	type: "object",
		// 	properties: {
		// 		success: { type: "boolean" },
		// 		error: { type: "string" },
		// 	},
		// },
	},
};

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<unknown>>) {
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
		await db.delete(cells).where(eq(cells.id, cellId)).returning({ id: cells.id });

		return res.send({
			success: true,
		});
	} catch (err) {
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
