import { eq } from "drizzle-orm";
import { operators } from "@openbts/drizzle";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof operators.$inferInsert };
type ReqParams = { Params: { operator_id: string } };
type RequestData = ReqBody & ReqParams;
type ResponseData = typeof operators.$inferSelect;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { operator_id } = req.params;

	try {
		const operator = await db
			.update(operators)
			.set(req.body)
			.where(eq(operators.id, Number.parseInt(operator_id)))
			.returning();
		if (!operator.length) throw new ErrorResponse("NOT_FOUND");

		return res.send({ success: true, data: operator[0] });
	} catch (error) {
		throw new ErrorResponse("FAILED_TO_UPDATE");
	}
}

const updateOperator: Route<RequestData, ResponseData> = {
	url: "/operators/:operator_id",
	method: "PATCH",
	config: { permissions: ["write:operators"] },
	handler,
};

export default updateOperator;
