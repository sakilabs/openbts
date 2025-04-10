import { eq } from "drizzle-orm";
import { stations } from "@openbts/drizzle";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof stations.$inferInsert };
type ReqParams = { Params: { station_id: string } };
type RequestData = ReqBody & ReqParams;
type ResponseData = typeof stations.$inferSelect;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { station_id } = req.params;

	try {
		const station = await db
			.update(stations)
			.set(req.body)
			.where(eq(stations.id, Number.parseInt(station_id)))
			.returning();
		if (!station.length) throw new ErrorResponse("NOT_FOUND");

		return res.send({ success: true, data: station[0] });
	} catch (error) {
		throw new ErrorResponse("FAILED_TO_UPDATE");
	}
}

const updateStation: Route<RequestData, ResponseData> = {
	url: "/stations/:station_id",
	method: "PATCH",
	config: { permissions: ["write:stations"] },
	handler,
};

export default updateStation;
