import { eq } from "drizzle-orm";
import { cells } from "@openbts/drizzle";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, EmptyResponse, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
	params: z.object({
		id: z.coerce.number<number>(),
	}),
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<EmptyResponse>) {
	const { id } = req.params;

	const cell = await db.query.cells.findFirst({
		where: (fields, { eq }) => eq(fields.id, id),
	});
	if (!cell) throw new ErrorResponse("NOT_FOUND");

	try {
		await db.delete(cells).where(eq(cells.id, id));
	} catch {
		throw new ErrorResponse("FAILED_TO_DELETE");
	}

	return res.status(204).send();
}

const deleteCell: Route<IdParams, void> = {
	url: "/cells/:id",
	method: "DELETE",
	config: { permissions: ["delete:cells"] },
	schema: schemaRoute,
	handler,
};

export default deleteCell;
