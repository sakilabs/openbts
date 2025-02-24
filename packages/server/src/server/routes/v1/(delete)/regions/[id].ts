import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { regions } from "@openbts/drizzle";
import { eq } from "drizzle-orm";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ResponseData = {
	message: string;
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;
	const region = await db.query.regions.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
	});

	if (!region) return res.status(404).send({ success: false, message: i18n.t("region.notFound") });

	await db.delete(regions).where(eq(regions.id, Number(id)));

	return res.send({ success: true, data: { message: i18n.t("region.deleted") } });
}

const deleteRegion: Route<IdParams, ResponseData> = {
	url: "/regions/:id",
	method: "DELETE",
	config: { permissions: ["delete:regions"] },
	handler,
};

export default deleteRegion;
