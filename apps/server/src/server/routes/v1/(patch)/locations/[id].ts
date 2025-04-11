import { eq } from "drizzle-orm";
import { locations } from "@openbts/drizzle";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

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

	if (Number.isNaN(locationId)) throw new ErrorResponse("INVALID_QUERY");

	const location = await db.query.locations.findFirst({
		where: (fields, { eq }) => eq(fields.id, locationId),
	});
	if (!location) throw new ErrorResponse("NOT_FOUND");

	try {
		const updated = await db.update(locations).set(req.body).where(eq(locations.id, locationId)).returning();

		return res.send({
			success: true,
			data: updated[0],
		});
	} catch (err) {
		throw new ErrorResponse("FAILED_TO_UPDATE");
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
