import { eq } from "drizzle-orm";
import { submissions } from "@openbts/drizzle";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { verifyPermissions } from "../../../../plugins/auth/utils.js";

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
			},
		},
		// 404: {
		// 	type: "object",
		// 	properties: {
		// 		success: { type: "boolean" },
		// 		message: { type: "string" },
		// 	},
		// },
		// 403: {
		// 	type: "object",
		// 	properties: {
		// 		success: { type: "boolean" },
		// 		message: { type: "string" },
		// 	},
		// },
		// 500: {
		// 	type: "object",
		// 	properties: {
		// 		success: { type: "boolean" },
		// 		message: { type: "string" },
		// 	},
		// },
	},
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { id } = req.params;
	const session = req.userSession;
	if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

	const hasAdminPermission = (await verifyPermissions(session.user.id, { submissions: ["delete"] })) || false;

	const submission = await db.query.submissions.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
		columns: {
			id: true,
			submitter_id: true,
		},
	});

	if (!submission) throw new ErrorResponse("NOT_FOUND");

	if (!hasAdminPermission && submission.submitter_id !== session.user.id) throw new ErrorResponse("FORBIDDEN");

	try {
		await db.delete(submissions).where(eq(submissions.id, Number(id)));
	} catch (error) {
		throw new ErrorResponse("FAILED_TO_DELETE");
	}

	return res.send({
		success: true,
	});
}

const deleteSubmission: Route<IdParams, ResponseData> = {
	url: "/submissions/:id",
	method: "DELETE",
	schema: schemaRoute,
	handler,
};

export default deleteSubmission;
