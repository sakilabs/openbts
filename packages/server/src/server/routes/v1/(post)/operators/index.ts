import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { operators } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof operators.$inferInsert };
type ResponseData = typeof operators.$inferSelect;

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { name, parent_id, mnc_code } = req.body;

	const operator = await db
		.insert(operators)
		.values({
			name,
			parent_id,
			mnc_code,
		})
		.returning();

	return res.send({ success: true, data: operator[0] });
}

const createOperator: Route<ReqBody, ResponseData> = {
	url: "/operators",
	method: "POST",
	config: { permissions: ["write:operators"] },
	handler,
};

export default createOperator;
