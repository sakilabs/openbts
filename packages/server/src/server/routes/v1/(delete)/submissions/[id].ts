import { eq } from "drizzle-orm";

import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { submissions } from "@openbts/drizzle";
import { PermissionManagerInstance } from "../../../../utils/permissions.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { SessionPayload } from "../../../../interfaces/auth.interface.js";

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<{ deleted: boolean }>>) {
	const { id } = req.params;
	const session = req.userSession as SessionPayload;
	const userId = session.sub;

	let hasAdminPermission = false;
	if (session.type === "user" && session.user?.scope)
		hasAdminPermission = PermissionManagerInstance.hasPermission(["delete:submissions"], session.user.scope);

	const submission = await db.query.submissions.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
		columns: {
			id: true,
			submitter_id: true,
		},
	});

	if (!submission) {
		return res.status(404).send({
			success: false,
			message: i18n.t("errors.resourceNotFound"),
		});
	}

	if (!hasAdminPermission && submission.submitter_id !== Number(userId)) {
		return res.status(403).send({
			success: false,
			message: i18n.t("errors.forbidden"),
		});
	}

	try {
		await db.delete(submissions).where(eq(submissions.id, Number(id)));

		return res.send({
			success: true,
			data: { deleted: true },
		});
	} catch (error) {
		console.error("Error deleting submission:", error);
		return res.status(500).send({
			success: false,
			message: i18n.t("errors.internalServerError"),
		});
	}
}

const deleteSubmission: Route<IdParams, { deleted: boolean }> = {
	url: "/submissions/:id",
	method: "DELETE",
	handler,
};

export default deleteSubmission;
