import { createSelectSchema } from "drizzle-zod";
import { inArray } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
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
import type { RouteGenericInterface } from "fastify";

const submissionsSchema = createSelectSchema(submissions);
const stationsSchema = createSelectSchema(stations);
const usersSchema = createSelectSchema(users).omit({ password: true });
const proposedCellsSchema = createSelectSchema(proposedCells);
const gsmSchema = createSelectSchema(proposedGSMCells).omit({ proposed_cell_id: true });
const umtsSchema = createSelectSchema(proposedUMTSCells).omit({ proposed_cell_id: true });
const lteSchema = createSelectSchema(proposedLTECells).omit({ proposed_cell_id: true });
const nrSchema = createSelectSchema(proposedNRCells).omit({ proposed_cell_id: true });
const proposedDetailsSchema = z.union([gsmSchema, umtsSchema, lteSchema, nrSchema]).nullable();
const proposedCellWithDetails = proposedCellsSchema.extend({ details: proposedDetailsSchema });
const schemaRoute = {
	response: {
		200: z.object({
			success: z.boolean(),
			data: z.array(
				submissionsSchema.extend({
					station: stationsSchema,
					submitter: usersSchema,
					reviewer: usersSchema.optional(),
					cells: z.array(proposedCellWithDetails),
				}),
			),
		}),
	},
};
type Submission = z.infer<typeof submissionsSchema> & {
	station: z.infer<typeof stationsSchema>;
	submitter: z.infer<typeof usersSchema>;
	reviewer?: z.infer<typeof usersSchema>;
	cells: z.infer<typeof proposedCellWithDetails>[];
};

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<Submission[]>>) {
	const rows = await db.query.submissions.findMany({
		with: {
			station: true,
			submitter: true,
			reviewer: true,
		},
	});

	const submissionIds = rows.map((s) => s.id).filter((n): n is number => n !== null && n !== undefined);
	const cellsBySubmission = new Map<number, z.infer<typeof proposedCellWithDetails>[]>();
	if (submissionIds.length > 0) {
		const rawCells = await db.query.proposedCells.findMany({
			where: inArray(proposedCells.submission_id, submissionIds as number[]),
			with: {
				gsm: true,
				umts: true,
				lte: true,
				nr: true,
			},
		});

		for (const { gsm, umts, lte, nr, ...base } of rawCells) {
			const pc = { ...base, details: gsm ?? umts ?? lte ?? nr ?? null } as z.infer<typeof proposedCellWithDetails>;
			const key = base.submission_id as number;
			const arr = cellsBySubmission.get(key) ?? [];
			arr.push(pc);
			cellsBySubmission.set(key, arr);
		}
	}

	const data: Submission[] = rows.map((s) => ({
		...s,
		cells: cellsBySubmission.get(s.id) ?? [],
	}));

	return res.send({ success: true, data });
}

const getSubmissions: Route<RouteGenericInterface, Submission[]> = {
	url: "/submissions",
	method: "GET",
	config: { permissions: ["read:submissions"] },
	schema: schemaRoute,
	handler,
};

export default getSubmissions;
