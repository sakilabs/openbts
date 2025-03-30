import { eq } from "drizzle-orm";

import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { submissions } from "@openbts/drizzle";
import { auth } from "../../../../plugins/betterauth.plugin.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ResponseData = {
	message: string;
};

const schemaRoute = {
	params: {
		type: "object",
		properties: {
			id: { type: "string" },
		},
		required: ["id"],
	},
	response: {
		200: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				data: {
					type: "object",
					properties: {
						message: { type: "string" },
					},
				},
			},
		},
		404: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				message: { type: "string" },
			},
		},
		403: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				message: { type: "string" },
			},
		},
		500: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				message: { type: "string" },
			},
		},
	},
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
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
					submissions: ["delete"],
				},
			},
		});

		if (hasPerm.success) hasAdminPermission = true;
	}

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

	if (!hasAdminPermission && submission.submitter_id !== Number(session.user.id)) {
		return res.status(403).send({
			success: false,
			message: i18n.t("errors.forbidden"),
		});
	}

	try {
		await db.delete(submissions).where(eq(submissions.id, Number(id)));
	} catch (error) {
		return res.status(500).send({
			success: false,
			message: i18n.t("errors.internalServerError"),
		});
	}

	return res.send({
		success: true,
		data: { message: i18n.t("submission.deleted") },
	});
}

const deleteSubmission: Route<IdParams, ResponseData> = {
	url: "/submissions/:id",
	method: "DELETE",
	schema: schemaRoute,
	handler,
};

export default deleteSubmission;
