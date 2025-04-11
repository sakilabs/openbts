import { bands } from "@openbts/drizzle";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof bands.$inferInsert };
type ResponseData = typeof bands.$inferSelect;

const schemaRoute = {
	body: {
		type: "object",
		properties: {
			name: { type: "string" },
			value: { type: "number" },
			ua_freq: { type: ["number", "null"] },
			duplex: { type: ["string", "null"] },
		},
		required: ["name", "value", "duplex"],
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
						name: { type: "string" },
						value: { type: "number" },
						ua_freq: { type: ["number", "null"] },
						duplex: { type: "string" },
					},
				},
			},
		},
		// 500: {
		// 	type: "object",
		// 	properties: {
		// 		success: { type: "boolean" },
		// 		error: { type: "string" },
		// 	},
		// },
	},
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	try {
		const band = await db.insert(bands).values(req.body).returning();

		return res.send({ success: true, data: band[0] });
	} catch (error) {
		throw new ErrorResponse("FAILED_TO_CREATE");
	}
}

const createBand: Route<ReqBody, ResponseData> = {
	url: "/bands",
	method: "POST",
	config: { permissions: ["write:bands"] },
	schema: schemaRoute,
	handler,
};

export default createBand;
