import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { cells } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof cells.$inferInsert };
type ResponseData = typeof cells.$inferSelect;

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const cell = await db
		.insert(cells)
		.values({
			...req.body,
			is_confimed: false,
			last_updated: new Date(),
			date_created: new Date(),
		})
		.returning();

	return res.send({ success: true, data: cell[0] });
}

const createCell: Route<ReqBody, ResponseData> = {
	url: "/cells",
	method: "POST",
	config: { permissions: ["write:cells"] },
	handler,
};

export default createCell;
