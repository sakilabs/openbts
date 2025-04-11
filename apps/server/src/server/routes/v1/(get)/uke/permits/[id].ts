import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";

import type { ukePermits, bands, operators } from "@openbts/drizzle";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

type Permit = typeof ukePermits.$inferSelect & { band: typeof bands.$inferSelect; operator: Omit<typeof operators.$inferSelect, "is_visible"> };

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Permit>>) {
	const { id } = req.params;

	try {
		const permit = await db.query.ukePermits.findFirst({
			with: {
				band: true,
				operator: {
					columns: {
						is_visible: false,
					},
				},
			},
			where: (fields, { eq }) => eq(fields.id, Number(id)),
		});
		if (!permit) throw new ErrorResponse("NOT_FOUND");

		return res.send({
			success: true,
			data: permit,
		});
	} catch (error) {
		console.error("Error retrieving UKE permit:", error);
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const getUkePermit: Route<IdParams, Permit> = {
	url: "/uke/permits/:id",
	method: "GET",
	config: { permissions: ["read:uke_permits"] },
	handler,
};

export default getUkePermit;
