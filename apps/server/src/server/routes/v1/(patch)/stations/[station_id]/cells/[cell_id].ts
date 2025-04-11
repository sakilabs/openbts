import { eq } from "drizzle-orm";
import { cells } from "@openbts/drizzle";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof cells.$inferInsert };
type ReqParams = { Params: { station_id: string; cell_id: string } };
type RequestData = ReqBody & ReqParams;
type ResponseData = typeof cells.$inferSelect;

const schemaRoute = {
	params: {
		type: "object",
		properties: {
			station_id: { type: "string" },
			cell_id: { type: "string" },
		},
		required: ["station_id", "cell_id"],
	},
	body: {
		type: "object",
		properties: {
			band_id: { type: "number" },
			config: {
				type: "object",
				properties: {
					ecid: { type: "number" },
					clid: { type: "number" },
					carrier: { type: "number" },
				},
				required: ["ecid", "clid", "carrier"],
			},
			sector: { type: "number" },
			is_confirmed: { type: "boolean" },
		},
		additionalProperties: false,
	},
	response: {
		200: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				data: {
					type: "object",
					properties: {
						id: { type: "number" },
						band_id: { type: "number" },
						config: {
							type: "object",
							properties: {
								ecid: { type: "number" },
								clid: { type: "number" },
								carrier: { type: "number" },
							},
						},
						sector: { type: "number" },
						is_confirmed: { type: "boolean" },
						last_updated: { type: "string" },
					},
				},
			},
		},
		404: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				error: { type: "string" },
			},
		},
	},
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
	} catch (err) {
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
