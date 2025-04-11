import { eq } from "drizzle-orm";
import { regions } from "@openbts/drizzle";

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
	const region = await db.query.regions.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
	});

	if (!region) throw new ErrorResponse("NOT_FOUND");

	try {
		await db.delete(regions).where(eq(regions.id, Number(id)));
	} catch (error) {
		throw new ErrorResponse("FAILED_TO_DELETE");
	}

	return res.send({ success: true });
}

const deleteRegion: Route<IdParams, ResponseData> = {
	url: "/regions/:id",
	method: "DELETE",
	config: { permissions: ["delete:regions"] },
	schema: schemaRoute,
	handler,
};

export default deleteRegion;
