import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { stations } from "@openbts/drizzle";
import { eq } from "drizzle-orm";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
	params: {
		type: "object",
		properties: {
			id: { type: "string" },
		},
		required: ["id"],
	},
	response: {
		200: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				data: {
					type: "object",
					properties: {
						bts_id: { type: "number" },
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

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<unknown>>) {
	const { id } = req.params;
	const stationId = Number(id);

	if (Number.isNaN(stationId)) {
		return res.status(400).send({
			success: false,
			error: i18n.t("errors.invalidStationId", req.language),
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

	try {
		await db.delete(stations).where(eq(stations.bts_id, stationId));

		return res.send({
			success: true,
			data: { message: i18n.t("station.deleted", req.language) },
		});
	} catch (error) {
		return res.status(500).send({
			success: false,
			error: i18n.t("errors.failedToDeleteStation", req.language),
		});
	}
}

const deleteStation: Route<IdParams> = {
	url: "/stations/:id",
	method: "DELETE",
	schema: schemaRoute,
	config: { permissions: ["delete:stations"] },
	handler,
};

export default deleteStation;
