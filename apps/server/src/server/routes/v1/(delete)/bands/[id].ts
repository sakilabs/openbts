import { eq } from "drizzle-orm";
import { bands } from "@openbts/drizzle";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ResponseData = { message: string };

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
	const band = await db.query.bands.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
	});

	if (!band) throw new ErrorResponse("NOT_FOUND");

	try {
		await db.delete(bands).where(eq(bands.id, Number(id)));
	} catch (error) {
		throw new ErrorResponse("FAILED_TO_DELETE");
	}

	return res.send({ success: true });
}

const deleteBand: Route<IdParams, ResponseData> = {
	url: "/bands/:id",
	method: "DELETE",
	config: { permissions: ["delete:bands"] },
	schema: schemaRoute,
	handler,
};

export default deleteBand;
