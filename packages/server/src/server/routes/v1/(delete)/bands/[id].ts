import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { bands } from "@openbts/drizzle";
import { eq } from "drizzle-orm";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ResponseData = { message: string };

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;
	const band = await db.query.bands.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
	});

	if (!band) return res.status(404).send({ success: false, message: i18n.t("band.notFound") });

	await db.delete(bands).where(eq(bands.id, Number(id)));

	return res.send({ success: true, data: { message: i18n.t("band.deleted") } });
}

const deleteBand: Route<IdParams, ResponseData> = {
	url: "/bands/:id",
	method: "DELETE",
	config: { permissions: ["delete:bands"] },
	handler,
};

export default deleteBand;
