import { locations } from "@openbts/drizzle";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof locations.$inferInsert };
type ResponseData = typeof locations.$inferSelect;

const schemaRoute = {
	body: {
		type: "object",
		properties: {
			id: { type: "string" },
			region_id: { type: "string" },
			city: { type: "string" },
			address: { type: "string" },
			longitude: { type: "number" },
			latitude: { type: "number" },
		},
		required: ["id", "region_id", "city", "address", "longitude", "latitude"],
	},
	response: {
		200: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				data: {
					type: "object",
					properties: {
						id: { type: "string" },
						region_id: { type: "string" },
						city: { type: "string" },
						address: { type: "string" },
						longitude: { type: "number" },
						latitude: { type: "number" },
					},
				},
			},
		},
		500: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				error: { type: "string" },
			},
		},
	},
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id, region_id, city, address, longitude, latitude } = req.body;

	try {
		const location = await db.insert(locations).values({ id, region_id, city, address, longitude, latitude }).returning();

		return res.send({ success: true, data: location[0] });
	} catch (error) {
		throw new ErrorResponse("FAILED_TO_CREATE");
	}
}

const createLocation: Route<ReqBody, ResponseData> = {
	url: "/locations",
	method: "POST",
	config: { permissions: ["write:locations"] },
	schema: schemaRoute,
	handler,
};

export default createLocation;
