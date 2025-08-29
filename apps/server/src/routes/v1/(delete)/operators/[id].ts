import { eq } from "drizzle-orm";
import { operators } from "@openbts/drizzle";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, Route, SuccessResponse } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
	params: z.object({
		id: z.number(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
		}),
	},
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<SuccessResponse>) {
	const { id } = req.params;

	const operator = await db.query.operators.findFirst({
		where: (fields, { eq }) => eq(fields.id, id),
	});
	if (!operator) throw new ErrorResponse("NOT_FOUND");

	try {
		await db.delete(operators).where(eq(operators.id, id));
	} catch {
		throw new ErrorResponse("FAILED_TO_DELETE");
	}

	return res.send({ success: true });
}

const deleteOperator: Route<IdParams> = {
	url: "/operators/:id",
	method: "DELETE",
	config: { permissions: ["delete:operators"] },
	schema: schemaRoute,
	handler,
};

export default deleteOperator;
