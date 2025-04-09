import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { auth } from "../../../../plugins/betterauth.plugin.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { submissions as submissionsType } from "@openbts/drizzle";

type Submission = typeof submissionsType.$inferSelect;

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Submission>>) {
	const { id } = req.params;
	const session = req.userSession;
	if (!session)
		return res.status(401).send({
			success: false,
			message: i18n.t("errors.forbidden"),
		});

	let hasAdminPermission = false;
	if (session.user) {
		const hasPerm = await auth.api.userHasPermission({
			body: {
				userId: session.user.id,
				permission: {
					submissions: ["read"],
				},
			},
		});

		if (hasPerm.success) hasAdminPermission = true;
	}

	const withTables = { station: true, submitter: true, reviewer: false };
	if (hasAdminPermission) withTables.reviewer = true;
	const submission = await db.query.submissions.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
		with: withTables,
	});
	if (!submission) return res.status(404).send({ success: false, message: i18n.t("submission.notFound") });

	if (!hasAdminPermission && submission.submitter_id !== Number(session.user.id))
		return res.status(403).send({ success: false, message: i18n.t("submission.forbidden") });

	return res.send({ success: true, data: submission });
}

const getSubmission: Route<IdParams, Submission> = {
	url: "/submissions/:id",
	method: "GET",
	config: { permissions: ["read:submissions"] },
	handler,
};

export default getSubmission;
