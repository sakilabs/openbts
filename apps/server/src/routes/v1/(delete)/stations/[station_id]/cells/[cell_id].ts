import { cells, gsmCells, umtsCells, lteCells, nrCells } from "@openbts/drizzle";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { Route, SuccessResponse } from "../../../../../../interfaces/routes.interface.js";

const schemaRoute = {
	params: z.object({
		station_id: z.coerce.number<number>(),
		cell_id: z.coerce.number<number>(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
		}),
	},
};
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<SuccessResponse>) {
	const { station_id, cell_id } = req.params;

	if (Number.isNaN(station_id) || Number.isNaN(cell_id)) throw new ErrorResponse("INVALID_QUERY");

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.id, station_id),
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	const cell = await db.query.cells.findFirst({
		where: (fields, { and, eq }) => and(eq(fields.id, cell_id), eq(fields.station_id, station.id)),
	});
	if (!cell) throw new ErrorResponse("NOT_FOUND");

	try {
		await db.transaction(async (tx) => {
			switch (cell.rat) {
				case "GSM":
					await tx.delete(gsmCells).where(eq(gsmCells.cell_id, cell.id));
					break;
				case "UMTS":
					await tx.delete(umtsCells).where(eq(umtsCells.cell_id, cell.id));
					break;
				case "LTE":
					await tx.delete(lteCells).where(eq(lteCells.cell_id, cell.id));
					break;
				case "NR":
					await tx.delete(nrCells).where(eq(nrCells.cell_id, cell.id));
					break;
			}

			await tx.delete(cells).where(eq(cells.id, cell_id));
		});

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
