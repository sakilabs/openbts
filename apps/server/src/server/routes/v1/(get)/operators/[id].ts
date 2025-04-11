import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { operators } from "@openbts/drizzle";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ResponseData = Omit<typeof operators.$inferSelect, "is_visible">;

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;

	const operator = await db.query.operators.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
		columns: {
			is_visible: false,
		},
	});
	if (!operator) throw new ErrorResponse("NOT_FOUND");

	return res.send({ success: true, data: operator });
}

const getOperator: Route<IdParams, ResponseData> = {
	url: "/operators/:id",
	method: "GET",
	config: { permissions: ["read:operators"] },
	handler,
};

export default getOperator;
