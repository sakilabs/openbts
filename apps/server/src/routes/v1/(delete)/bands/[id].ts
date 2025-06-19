import { eq } from "drizzle-orm";
import { bands } from "@openbts/drizzle";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, SuccessResponse, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
	params: z.object({
		id: z.number(),
	}),
	response: z.object({
		200: z.object({
			success: z.boolean(),
		}),
	}),
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<SuccessResponse>) {
	const { id } = req.params;
	const band = await db.query.bands.findFirst({
		where: (fields, { eq }) => eq(fields.id, id),
	});
	if (!band) throw new ErrorResponse("NOT_FOUND");

	try {
		await db.delete(bands).where(eq(bands.id, id));
	} catch {
		throw new ErrorResponse("FAILED_TO_DELETE");
	}

	return res.send({ success: true });
}

const deleteBand: Route<IdParams> = {
	url: "/bands/:id",
	method: "DELETE",
	config: { permissions: ["delete:bands"] },
	schema: schemaRoute,
	handler,
};

export default deleteBand;
