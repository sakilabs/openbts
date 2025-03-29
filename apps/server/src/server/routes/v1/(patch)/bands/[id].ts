import { eq } from "drizzle-orm";
import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { bands } from "@openbts/drizzle";

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
		if (!band.length) return res.status(404).send({ success: false, message: "Band not found" });

		return res.send({ success: true, data: band[0] });
	} catch (error) {
		return res.status(500).send({ success: false, error: i18n.t("errors.failedToUpdate") });
	}
}

const updateBand: Route<RequestData, ResponseData> = {
	url: "/bands/:band_id",
	method: "PATCH",
	config: { permissions: ["write:bands"] },
	handler,
};

export default updateBand;
