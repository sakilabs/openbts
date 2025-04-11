import { regions } from "@openbts/drizzle";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof regions.$inferInsert };
type ResponseData = typeof regions.$inferSelect;

const schemaRoute = {
	body: {
		type: "object",
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
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
	const { name } = req.body;

	try {
		const region = await db
			.insert(regions)
			.values({
				name,
			})
			.returning();

		return res.send({ success: true, data: region[0] });
	} catch (error) {
		throw new ErrorResponse("FAILED_TO_CREATE");
	}
}

const createRegion: Route<ReqBody, ResponseData> = {
	url: "/regions",
	method: "POST",
	config: { permissions: ["write:regions"] },
	schema: schemaRoute,
	handler,
};

export default createRegion;
