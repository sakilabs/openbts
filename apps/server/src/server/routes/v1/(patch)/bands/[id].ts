import { eq } from "drizzle-orm";
import { bands } from "@openbts/drizzle";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof bands.$inferInsert };
type ReqParams = { Params: { band_id: string } };
type RequestData = ReqBody & ReqParams;
type ResponseData = typeof bands.$inferSelect;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { band_id } = req.params;

	try {
		const band = await db
			.update(bands)
			.set(req.body)
			.where(eq(bands.id, Number.parseInt(band_id)))
			.returning();
		if (!band.length) throw new ErrorResponse("NOT_FOUND");

		return res.send({ success: true, data: band[0] });
	} catch (error) {
		throw new ErrorResponse("FAILED_TO_UPDATE");
	}
}

const updateBand: Route<RequestData, ResponseData> = {
	url: "/bands/:band_id",
	method: "PATCH",
	config: { permissions: ["write:bands"] },
	handler,
};

export default updateBand;
