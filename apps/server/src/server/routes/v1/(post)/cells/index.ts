import { cells } from "@openbts/drizzle";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof cells.$inferInsert };
type ResponseData = typeof cells.$inferSelect;

const schemaRoute = {
	// todo: need
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	try {
		const cell = await db
			.insert(cells)
			.values({
				...req.body,
				is_confirmed: false,
				last_updated: new Date(),
				date_created: new Date(),
			})
			.returning();

		return res.send({ success: true, data: cell[0] });
	} catch (error) {
		throw new ErrorResponse("FAILED_TO_CREATE");
	}
}

const createCell: Route<ReqBody, ResponseData> = {
	url: "/cells",
	method: "POST",
	config: { permissions: ["write:cells"] },
	handler,
};

export default createCell;
