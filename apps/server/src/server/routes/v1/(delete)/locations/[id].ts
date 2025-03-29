import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { locations } from "@openbts/drizzle";
import { eq } from "drizzle-orm";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ResponseData = {
	message: string;
};

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
						message: { type: "string" },
					},
				},
			},
		},
		404: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				message: { type: "string" },
			},
		},
		500: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				message: { type: "string" },
			},
		},
	},
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;
	const location = await db.query.locations.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
	});

	if (!location) return res.status(404).send({ success: false, message: i18n.t("location.notFound") });

	try {
		await db.delete(locations).where(eq(locations.id, Number(id)));
	} catch (error) {
		console.error("Error deleting location:", error);
		return res.status(500).send({ success: false, error: i18n.t("errors.failedToDelete", req.language) });
	}

	return res.send({ success: true, data: { message: i18n.t("location.deleted") } });
}

const deleteLocation: Route<IdParams, ResponseData> = {
	url: "/locations/:id",
	method: "DELETE",
	config: { permissions: ["delete:locations"] },
	schema: schemaRoute,
	handler,
};

export default deleteLocation;
