import db from "../../../../../database/psql.js";
import { formatRadioLine } from "../../../../../utils/index.js";
import { ErrorResponse } from "../../../../../errors.js";

import type { FormattedRadioLine } from "@openbts/drizzle/types";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<FormattedRadioLine>>) {
	const { id } = req.params;

	try {
		const radioLine = await db.query.ukeRadioLines.findFirst({
			where: (fields, { eq }) => eq(fields.id, Number(id)),
			with: {
				operator: {
					columns: {
						is_visible: false,
					},
				},
			},
			columns: {
				operator_id: false,
			},
		});

		if (!radioLine) throw new ErrorResponse("NOT_FOUND");

		return res.send({
			success: true,
			data: await formatRadioLine(radioLine),
		});
	} catch (error) {
		console.error("Error retrieving UKE radioline:", error);
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const getUkeRadioLine: Route<IdParams, FormattedRadioLine> = {
	url: "/uke/radiolines/:id",
	method: "GET",
	config: { permissions: ["read:uke_radiolines"] },
	handler,
};

export default getUkeRadioLine;
