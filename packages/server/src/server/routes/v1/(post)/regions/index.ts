import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { regions } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof regions.$inferInsert };
type ResponseData = typeof regions.$inferSelect;

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { name } = req.body;

	const region = await db
		.insert(regions)
		.values({
			name,
		})
		.returning();

	return res.send({ success: true, data: region[0] });
}

const createRegion: Route<ReqBody, ResponseData> = {
	url: "/regions",
	method: "POST",
	config: { permissions: ["write:regions"] },
	handler,
};

export default createRegion;
