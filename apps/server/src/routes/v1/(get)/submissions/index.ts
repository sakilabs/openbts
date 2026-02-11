import { createSelectSchema } from "drizzle-zod";
import { inArray, count, desc, eq, and } from "drizzle-orm";
import { z } from "zod";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { getRuntimeSettings } from "../../../../services/settings.service.js";
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
const usersSchema = createSelectSchema(users).pick({ id: true, name: true, image: true, displayUsername: true });
const proposedCellsSchema = createSelectSchema(proposedCells);
const gsmSchema = createSelectSchema(proposedGSMCells).omit({ proposed_cell_id: true });
const umtsSchema = createSelectSchema(proposedUMTSCells).omit({ proposed_cell_id: true });
const lteSchema = createSelectSchema(proposedLTECells).omit({ proposed_cell_id: true });
const nrSchema = createSelectSchema(proposedNRCells).omit({ proposed_cell_id: true });
const proposedDetailsSchema = z.union([gsmSchema, umtsSchema, lteSchema, nrSchema]).nullable();
const proposedCellWithDetails = proposedCellsSchema.extend({ details: proposedDetailsSchema });

const schemaRoute = {
	querystring: z.object({
		limit: z.coerce.number().min(1).max(100).default(10),
		offset: z.coerce.number().min(0).default(0),
		status: z.enum(["pending", "approved", "rejected"]).optional(),
		type: z.enum(["new", "update", "delete"]).optional(),
	}),
	response: {
		200: z.object({
			data: z.array(
				submissionsSchema.extend({
					station: stationsSchema.nullable(),
					submitter: usersSchema,
					reviewer: usersSchema.nullable(),
					cells: z.array(proposedCellWithDetails),
				}),
			),
			totalCount: z.number(),
		}),
	},
};

type Submission = z.infer<typeof submissionsSchema> & {
	station: z.infer<typeof stationsSchema> | null;
	submitter: z.infer<typeof usersSchema>;
	reviewer: z.infer<typeof usersSchema> | null;
	cells: z.infer<typeof proposedCellWithDetails>[];
};

type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };
type ResponseData = z.infer<typeof submissionsSchema> & {
	station: z.infer<typeof stationsSchema> | null;
	submitter: z.infer<typeof usersSchema>;
	reviewer: z.infer<typeof usersSchema> | null;
	cells: z.infer<typeof proposedCellWithDetails>[];
};
type ResponseBody = { data: ResponseData[]; totalCount: number };

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResponseBody>>) {
	if (!getRuntimeSettings().submissionsEnabled) throw new ErrorResponse("FORBIDDEN");

	const { limit, offset, status, type } = req.query;

	const whereConditions = [];
	if (status) whereConditions.push(eq(submissions.status, status));
	if (type) whereConditions.push(eq(submissions.type, type));

	const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

	const [totalCount] = await db.select({ count: count() }).from(submissions).where(whereClause);

	const rows = await db.query.submissions.findMany({
		limit,
		offset,
		orderBy: [desc(submissions.createdAt)],
		where: whereClause,
		with: {
			station: true,
			submitter: {
				columns: {
					id: true,
					name: true,
					image: true,
					displayUsername: true,
				},
			},
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

	const submissionIds = rows.map((s) => s.id).filter((n): n is string => n !== null && n !== undefined);
	const cellsBySubmission = new Map<string, z.infer<typeof proposedCellWithDetails>[]>();

	if (submissionIds.length > 0) {
		const rawCells = await db.query.proposedCells.findMany({
			where: inArray(proposedCells.submission_id, submissionIds as string[]),
			with: {
				gsm: true,
				umts: true,
				lte: true,
				nr: true,
			},
		});

		for (const { gsm, umts, lte, nr, ...base } of rawCells) {
			const pc = { ...base, details: gsm ?? umts ?? lte ?? nr ?? null } as z.infer<typeof proposedCellWithDetails>;
			const key = base.submission_id as string;
			const arr = cellsBySubmission.get(key) ?? [];
			arr.push(pc);
			cellsBySubmission.set(key, arr);
		}
	}

	const data: Submission[] = rows.map((s) => ({
		...s,
		cells: cellsBySubmission.get(s.id) ?? [],
	}));

	return res.send({ data, totalCount: totalCount?.count ?? 0 });
}

const getSubmissions: Route<ReqQuery, ResponseBody> = {
	url: "/submissions",
	method: "GET",
	config: { permissions: ["read:submissions"] },
	schema: schemaRoute,
	handler: handler,
};

export default getSubmissions;
