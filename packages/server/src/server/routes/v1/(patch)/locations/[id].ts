import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { locations } from "@openbts/drizzle";
import { eq } from "drizzle-orm";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof locations.$inferInsert };
type ReqParams = { Params: { location_id: string } };
type RequestData = ReqBody & ReqParams;
type ResponseData = typeof locations.$inferSelect;

const schemaRoute = {
	params: {
		type: "object",
		properties: {
			id: { type: "string" },
		},
		required: ["id"],
	},
	body: {
		type: "object",
		properties: {
			region_id: { type: "number" },
			city: { type: "string", maxLength: 100 },
			address: { type: "string" },
			longitude: { type: "number", minimum: -180, maximum: 180 },
			latitude: { type: "number", minimum: -90, maximum: 90 },
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
						region_id: { type: "number" },
						city: { type: "string" },
						address: { type: "string" },
						longitude: { type: "number" },
						latitude: { type: "number" },
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
	const { location_id } = req.params;
	const locationId = Number(location_id);

	if (Number.isNaN(locationId)) {
		return res.status(400).send({
			success: false,
			error: i18n.t("errors.invalidLocationId", req.language),
		});
	}

	const location = await db.query.locations.findFirst({
		where: (fields, { eq }) => eq(fields.id, locationId),
	});
	if (!location) {
		return res.status(404).send({
			success: false,
			error: i18n.t("location.notFound", req.language),
		});
	}

	try {
		const updated = await db.update(locations).set(req.body).where(eq(locations.id, locationId)).returning();

		return res.send({
			success: true,
			data: updated[0],
		});
	} catch (err) {
		return res.status(500).send({
			success: false,
			error: i18n.t("errors.failedToUpdateLocation", req.language),
			message: err instanceof Error ? err.message : undefined,
		});
	}
}

const updateLocation: Route<RequestData, ResponseData> = {
	url: "/locations/:location_id",
	method: "PATCH",
	schema: schemaRoute,
	config: { permissions: ["write:locations"] },
	handler,
};

export default updateLocation;
