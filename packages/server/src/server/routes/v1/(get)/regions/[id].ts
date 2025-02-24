import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { regions } from "@openbts/drizzle";

type Region = typeof regions.$inferSelect;

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Region>>) {
	const { id } = req.params;

	const region = await db.query.regions.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
	});
	if (!region) return res.status(404).send({ success: false, message: i18n.t("region.notFound") });

	return res.send({ success: true, data: region });
}

const getRegion: Route<IdParams, Region> = {
	url: "/regions/:id",
	method: "GET",
	config: { permissions: ["read:regions"] },
	handler,
};

export default getRegion;
