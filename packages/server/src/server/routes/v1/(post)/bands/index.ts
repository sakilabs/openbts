import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { bands } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof bands.$inferInsert };
type ResponseData = typeof bands.$inferSelect;

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const band = await db.insert(bands).values(req.body).returning();

	return res.send({ success: true, data: band[0] });
}

const createBand: Route<ReqBody, ResponseData> = {
	url: "/bands",
	method: "POST",
	config: { permissions: ["write:bands"] },
	handler,
};

export default createBand;
