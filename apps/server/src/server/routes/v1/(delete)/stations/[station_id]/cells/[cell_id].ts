import db from "../../../../../../database/psql.js";
import { i18n } from "../../../../../../i18n/index.js";
import { cells } from "@openbts/drizzle";
import { eq } from "drizzle-orm";

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
				data: {
					type: "object",
					properties: {
						id: { type: "number" },
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

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<unknown>>) {
	const { station_id, cell_id } = req.params;
	const stationId = Number(station_id);
	const cellId = Number(cell_id);

	if (Number.isNaN(stationId) || Number.isNaN(cellId)) {
		return res.status(400).send({
			success: false,
			error: i18n.t("errors.invalidId", req.language),
		});
	}

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.bts_id, stationId),
	});
	if (!station) {
		return res.status(404).send({
			success: false,
			error: i18n.t("station.notFound", req.language),
		});
	}

	const cell = await db.query.cells.findFirst({
		where: (fields, { and, eq }) => and(eq(fields.id, cellId), eq(fields.station_id, station.id)),
	});
	if (!cell) {
		return res.status(404).send({
			success: false,
			error: i18n.t("cell.notFound", req.language),
		});
	}

	try {
		await db.delete(cells).where(eq(cells.id, cellId)).returning({ id: cells.id });

		return res.send({
			success: true,
			data: { message: i18n.t("cell.deleted", req.language) },
		});
	} catch (err) {
		return res.status(500).send({
			success: false,
			error: i18n.t("errors.failedToDeleteCell", req.language),
		});
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
