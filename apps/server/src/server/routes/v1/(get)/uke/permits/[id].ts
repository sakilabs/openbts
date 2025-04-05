import db from "../../../../../database/psql.js";
import { i18n } from "../../../../../i18n/index.js";
import { eq } from "drizzle-orm";
import type { ukePermits, bands } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

type Permit = typeof ukePermits.$inferSelect & { band?: typeof bands.$inferSelect | null };

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Permit>>) {
	const { id } = req.params;

	try {
		const permit = await db.query.ukePermits.findFirst({
			with: {
				band: true,
			},
			where: (fields) => eq(fields.id, Number(id)),
		});

		if (!permit) {
			return res.status(404).send({
				success: false,
				message: i18n.t("uke.permit.notFound", req.language),
			});
		}

		return res.send({
			success: true,
			data: permit,
		});
	} catch (error) {
		console.error("Error retrieving UKE permit:", error);
		return res.status(500).send({
			success: false,
			error: i18n.t("errors.internalServerError", req.language),
		});
	}
}

const getUkePermit: Route<IdParams, Permit> = {
	url: "/uke/permits/:id",
	method: "GET",
	config: { permissions: ["read:uke_permits"] },
	handler,
};

export default getUkePermit;
