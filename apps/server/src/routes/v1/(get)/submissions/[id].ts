import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { verifyPermissions } from "../../../../plugins/auth/utils.js";
import { stations, submissions, users } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type Submission = typeof submissions.$inferSelect;
const submissionsSchema = createSelectSchema(submissions);
const stationsSchema = createSelectSchema(stations);
const submittersSchema = createSelectSchema(users);
const reviewersSchema = createSelectSchema(users);
const schemaRoute = {
	params: z.object({
		id: z.string(),
	}),
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: submissionsSchema.extend({
				station: stationsSchema,
				submitter: submittersSchema,
				reviewer: reviewersSchema.optional(),
			}),
		}),
	}),
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Submission>>) {
	const { id } = req.params;
	const session = req.userSession;
	if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");
	const hasAdminPermission = (await verifyPermissions(session.user.id, { submissions: ["read"] })) || false;

	const withTables = { station: true, submitter: true, reviewer: false };
	if (hasAdminPermission) withTables.reviewer = true;

	const submission = await db.query.submissions.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(id)),
		with: withTables,
	});
	if (!submission) throw new ErrorResponse("NOT_FOUND");

	if (!hasAdminPermission && submission.submitter_id !== session.user.id) throw new ErrorResponse("FORBIDDEN");

	return res.send({ success: true, data: submission });
}

const getSubmission: Route<IdParams, Submission> = {
	url: "/submissions/:id",
	method: "GET",
	config: { permissions: ["read:submissions"] },
	schema: schemaRoute,
	handler,
};

export default getSubmission;
