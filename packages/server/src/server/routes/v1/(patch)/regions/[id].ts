import { eq } from "drizzle-orm";
import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { regions } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof regions.$inferInsert };
type ReqParams = { Params: { region_id: string } };
type RequestData = ReqBody & ReqParams;
type ResponseData = typeof regions.$inferSelect;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { region_id } = req.params;

	const region = await db
		.update(regions)
		.set(req.body)
		.where(eq(regions.id, Number.parseInt(region_id)))
		.returning();
	if (!region.length) return res.status(404).send({ success: false, message: "Region not found" });

	return res.send({ success: true, data: region[0] });
}

const updateRegion: Route<RequestData, ResponseData> = {
	url: "/regions/:region_id",
	method: "PATCH",
	config: { permissions: ["write:regions"] },
	handler,
};

export default updateRegion;
