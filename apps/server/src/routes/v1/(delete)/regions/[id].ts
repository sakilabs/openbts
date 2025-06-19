import { eq } from "drizzle-orm";
import { regions } from "@openbts/drizzle";
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
	const region = await db.query.regions.findFirst({
		where: (fields, { eq }) => eq(fields.id, id),
	});

	if (!region) throw new ErrorResponse("NOT_FOUND");

	try {
		await db.delete(regions).where(eq(regions.id, id));
	} catch {
		throw new ErrorResponse("FAILED_TO_DELETE");
	}

	return res.send({ success: true });
}

const deleteRegion: Route<IdParams> = {
	url: "/regions/:id",
	method: "DELETE",
	config: { permissions: ["delete:regions"] },
	schema: schemaRoute,
	handler,
};

export default deleteRegion;
