import { eq } from "drizzle-orm";
import { regions } from "@openbts/drizzle";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof regions.$inferInsert };
type ReqParams = { Params: { region_id: string } };
type RequestData = ReqBody & ReqParams;
type ResponseData = typeof regions.$inferSelect;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { region_id } = req.params;

	try {
		const region = await db
			.update(regions)
			.set(req.body)
			.where(eq(regions.id, Number.parseInt(region_id)))
			.returning();
		if (!region.length) throw new ErrorResponse("NOT_FOUND");

		return res.send({ success: true, data: region[0] });
	} catch (error) {
		throw new ErrorResponse("FAILED_TO_UPDATE");
	}
}

const updateRegion: Route<RequestData, ResponseData> = {
	url: "/regions/:region_id",
	method: "PATCH",
	config: { permissions: ["write:regions"] },
	handler,
};

export default updateRegion;
