import { operators } from "@openbts/drizzle";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof operators.$inferInsert };
type ResponseData = typeof operators.$inferSelect;

const schemaRoute = {
	body: {
		type: "object",
		properties: {
			name: { type: "string" },
			parent_id: { type: "string" },
			mnc_code: { type: "string" },
		},
		required: ["name", "parent_id", "mnc_code"],
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
						parent_id: { type: "string" },
						mnc_code: { type: "string" },
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
	const { name, parent_id, mnc_code } = req.body;

	try {
		const operator = await db
			.insert(operators)
			.values({
				name,
				parent_id,
				mnc_code,
			})
			.returning();

		return res.send({ success: true, data: operator[0] });
	} catch (error) {
		throw new ErrorResponse("FAILED_TO_CREATE");
	}
}

const createOperator: Route<ReqBody, ResponseData> = {
	url: "/operators",
	method: "POST",
	config: { permissions: ["write:operators"] },
	schema: schemaRoute,
	handler,
};

export default createOperator;
