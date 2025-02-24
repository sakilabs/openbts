import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { locations } from "@openbts/drizzle";
import { eq } from "drizzle-orm";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ResponseData = {
	message: string;
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;
	const location = await db.query.locations.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
	});

	if (!location) return res.status(404).send({ success: false, message: i18n.t("location.notFound") });

	await db.delete(locations).where(eq(locations.id, Number(id)));

	return res.send({ success: true, data: { message: i18n.t("location.deleted") } });
}

const deleteLocation: Route<IdParams, ResponseData> = {
	url: "/locations/:id",
	method: "DELETE",
	config: { permissions: ["delete:locations"] },
	handler,
};

export default deleteLocation;
