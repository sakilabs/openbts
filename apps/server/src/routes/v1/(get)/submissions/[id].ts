import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { getRuntimeSettings } from "../../../../services/settings.service.js";
import { verifyPermissions } from "../../../../plugins/auth/utils.js";
import {
	stations,
	submissions,
	users,
	proposedCells,
	proposedGSMCells,
	proposedUMTSCells,
	proposedLTECells,
	proposedNRCells,
} from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const submissionsSchema = createSelectSchema(submissions);
const stationsSchema = createSelectSchema(stations);
const submittersSchema = createSelectSchema(users);
const reviewersSchema = createSelectSchema(users).pick({ id: true, name: true, image: true, displayUsername: true });
const proposedCellsSchema = createSelectSchema(proposedCells);
const gsmSchema = createSelectSchema(proposedGSMCells).omit({ proposed_cell_id: true });
const umtsSchema = createSelectSchema(proposedUMTSCells).omit({ proposed_cell_id: true });
const lteSchema = createSelectSchema(proposedLTECells).omit({ proposed_cell_id: true });
const nrSchema = createSelectSchema(proposedNRCells).omit({ proposed_cell_id: true });
const proposedDetailsSchema = z.union([gsmSchema, umtsSchema, lteSchema, nrSchema]).nullable();
const schemaRoute = {
	params: z.object({
		id: z.coerce.string<string>(),
	}),
	response: {
		200: z.object({
			data: submissionsSchema
				.extend({
					station: stationsSchema.nullable(),
					submitter: submittersSchema,
					reviewer: reviewersSchema.nullable(),
				})
				.extend({
					cells: z.array(proposedCellsSchema.extend({ details: proposedDetailsSchema })),
				}),
		}),
	},
};
type ReqParams = { Params: { id: string } };
type Submission = z.infer<typeof submissionsSchema> & {
	station: z.infer<typeof stationsSchema> | null;
	submitter: z.infer<typeof submittersSchema>;
	reviewer: z.infer<typeof reviewersSchema> | null;
	cells: Array<z.infer<typeof proposedCellsSchema> & { details: z.infer<typeof proposedDetailsSchema> }>;
};

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<Submission>>) {
	if (!getRuntimeSettings().submissionsEnabled) throw new ErrorResponse("FORBIDDEN");
	const { id } = req.params;
	const session = req.userSession;
	if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");
	const hasAdminPermission = (await verifyPermissions(session.user.id, { submissions: ["read"] })) || false;

	const submission = await db.query.submissions.findFirst({
		where: (fields, { eq }) => eq(fields.id, id),
		with: {
			station: true,
			submitter: true,
			reviewer: {
				columns: {
					id: true,
					name: true,
					image: true,
					displayUsername: true,
				},
			},
		},
	});
	if (!submission) throw new ErrorResponse("NOT_FOUND");
	if (!hasAdminPermission && submission.submitter_id !== session.user.id) throw new ErrorResponse("FORBIDDEN");

	const rawCells = await db.query.proposedCells.findMany({
		where: (fields, { eq }) => eq(fields.submission_id, submission.id),
		with: {
			gsm: true,
			umts: true,
			lte: true,
			nr: true,
		},
	});

	const cells = rawCells.map(({ gsm, umts, lte, nr, ...base }) => ({
		...base,
		details: gsm ?? umts ?? lte ?? nr ?? null,
	}));

	return res.send({ data: { ...submission, cells } });
}

const getSubmission: Route<ReqParams, Submission> = {
	url: "/submissions/:id",
	method: "GET",
	config: { permissions: ["read:submissions"] },
	schema: schemaRoute,
	handler,
};

export default getSubmission;
