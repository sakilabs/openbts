import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { verifyPermissions } from "../../../../plugins/auth/utils.js";
import { stations, submissions, users } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const submissionsSchema = createSelectSchema(submissions);
const stationsSchema = createSelectSchema(stations);
const submittersSchema = createSelectSchema(users);
const reviewersSchema = createSelectSchema(users);
const schemaRoute = {
	params: z.object({
		id: z.number(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: submissionsSchema.extend({
				station: stationsSchema,
				submitter: submittersSchema,
				reviewer: reviewersSchema.optional(),
			}),
		}),
	},
};
type Submission = z.infer<typeof submissionsSchema> & {
	station: z.infer<typeof stationsSchema>;
	submitter: z.infer<typeof submittersSchema>;
	reviewer?: z.infer<typeof reviewersSchema>;
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Submission>>) {
	const { id } = req.params;
	const session = req.userSession;
	if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");
	const hasAdminPermission = (await verifyPermissions(session.user.id, { submissions: ["read"] })) || false;

	const withTables = { station: true, submitter: true, reviewer: false };
	if (hasAdminPermission) withTables.reviewer = true;

	const submission = await db.query.submissions.findFirst({
		where: (fields, { eq }) => eq(fields.id, id),
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
