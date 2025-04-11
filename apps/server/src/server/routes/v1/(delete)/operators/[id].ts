import { eq } from "drizzle-orm";
import { operators } from "@openbts/drizzle";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

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
			},
		},
		// 404: {
		// 	type: "object",
		// 	properties: {
		// 		success: { type: "boolean" },
		// 		message: { type: "string" },
		// 	},
		// },
		// 500: {
		// 	type: "object",
		// 	properties: {
		// 		success: { type: "boolean" },
		// 		message: { type: "string" },
		// 	},
		// },
	},
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;
	const operator = await db.query.operators.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
	});

	if (!operator) throw new ErrorResponse("NOT_FOUND");

	try {
		await db.delete(operators).where(eq(operators.id, Number(id)));
	} catch (error) {
		throw new ErrorResponse("FAILED_TO_DELETE");
	}

	return res.send({ success: true });
}

const deleteOperator: Route<IdParams, ResponseData> = {
	url: "/operators/:id",
	method: "DELETE",
	config: { permissions: ["delete:operators"] },
	schema: schemaRoute,
	handler,
};

export default deleteOperator;
