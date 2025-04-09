import { eq } from "drizzle-orm/pg-core/expressions";

import db from "../../../../../database/psql.js";
import { i18n } from "../../../../../i18n/index.js";
import { formatRadioLine } from "../../../../../utils/index.js";

import type { FormattedRadioLine } from "@openbts/drizzle/types";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<FormattedRadioLine>>) {
	const { id } = req.params;

	try {
		const radioLine = await db.query.ukeRadioLines.findFirst({
			where: (fields) => eq(fields.id, Number(id)),
			with: {
				operator: true,
			},
			columns: {
				operator_id: false,
			},
		});

		if (!radioLine) {
			return res.status(404).send({
				success: false,
				message: i18n.t("uke.radioline.notFound", req.language),
			});
		}

		return res.send({
			success: true,
			data: await formatRadioLine(radioLine),
		});
	} catch (error) {
		console.error("Error retrieving UKE radioline:", error);
		return res.status(500).send({
			success: false,
			error: i18n.t("errors.internalServerError", req.language),
		});
	}
}

const getUkeRadioLine: Route<IdParams, FormattedRadioLine> = {
	url: "/uke/radiolines/:id",
	method: "GET",
	config: { permissions: ["read:uke_radiolines"] },
	handler,
};

export default getUkeRadioLine;
