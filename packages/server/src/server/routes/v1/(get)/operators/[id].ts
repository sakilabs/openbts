import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";

import type { operators } from "@openbts/drizzle";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ResponseData = typeof operators.$inferSelect;

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;

	const operator = await db.query.operators.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
	});

	if (!operator) {
		return res.status(404).send({ success: false, message: i18n.t("operator.notFound") });
	}

	return res.send({ success: true, data: operator });
}

const getOperator: Route<IdParams, ResponseData> = {
	url: "/operators/:id",
	method: "GET",
	config: { permissions: ["read:operators"] },
	handler,
};

export default getOperator;
