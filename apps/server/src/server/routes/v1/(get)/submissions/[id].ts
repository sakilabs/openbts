import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { submissions as submissionsType } from "@openbts/drizzle";

type Submission = typeof submissionsType.$inferSelect;

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Submission>>) {
	const { id } = req.params;

	const submission = await db.query.submissions.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
		with: {
			station: true,
			submitter: true,
			reviewer: true,
		},
	});
	if (!submission) return res.status(404).send({ success: false, message: i18n.t("submission.notFound") });

	return res.send({ success: true, data: submission });
}

const getSubmission: Route<IdParams, Submission> = {
	url: "/submissions/:id",
	method: "GET",
	config: { permissions: ["read:submissions"] },
	handler,
};

export default getSubmission;
