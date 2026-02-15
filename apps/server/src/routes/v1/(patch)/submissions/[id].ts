import { eq, inArray } from "drizzle-orm";
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { getRuntimeSettings } from "../../../../services/settings.service.js";
import { verifyPermissions } from "../../../../plugins/auth/utils.js";
import {
	submissions,
	proposedCells,
	proposedGSMCells,
	proposedUMTSCells,
	proposedLTECells,
	proposedNRCells,
	proposedStations,
	proposedLocations,
} from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const submissionsSelectSchema = createSelectSchema(submissions);
const proposedCellsSelectSchema = createSelectSchema(proposedCells);

const gsmInsertSchema = createInsertSchema(proposedGSMCells).omit({ proposed_cell_id: true }).strict();
const umtsInsertSchema = createInsertSchema(proposedUMTSCells).omit({ proposed_cell_id: true }).strict();
const lteInsertSchema = createInsertSchema(proposedLTECells).omit({ proposed_cell_id: true }).strict();
const nrInsertSchema = createInsertSchema(proposedNRCells).omit({ proposed_cell_id: true }).strict();

const cellInputSchema = createInsertSchema(proposedCells)
	.omit({ createdAt: true, updatedAt: true, submission_id: true, is_confirmed: true })
	.extend({
		details: z.union([gsmInsertSchema, umtsInsertSchema, lteInsertSchema, nrInsertSchema]).optional(),
	});

const stationInputSchema = createInsertSchema(proposedStations).omit({ createdAt: true, updatedAt: true, submission_id: true }).partial();

const locationInputSchema = createInsertSchema(proposedLocations).omit({ createdAt: true, updatedAt: true, submission_id: true }).partial();

const requestSchema = z.object({
	review_notes: z.string().optional(),
	submitter_note: z.string().optional(),
	station: stationInputSchema.optional(),
	location: locationInputSchema.optional(),
	cells: z.array(cellInputSchema).optional(),
});

const gsmSelectSchema = createSelectSchema(proposedGSMCells).omit({ proposed_cell_id: true });
const umtsSelectSchema = createSelectSchema(proposedUMTSCells).omit({ proposed_cell_id: true });
const lteSelectSchema = createSelectSchema(proposedLTECells).omit({ proposed_cell_id: true });
const nrSelectSchema = createSelectSchema(proposedNRCells).omit({ proposed_cell_id: true });
const detailsSchema = z.union([gsmSelectSchema, umtsSelectSchema, lteSelectSchema, nrSelectSchema]).nullable();

const responseSchema = submissionsSelectSchema.extend({
	cells: z.array(proposedCellsSelectSchema.extend({ details: detailsSchema })),
});

const schemaRoute = {
	params: z.object({
		id: z.coerce.string<string>(),
	}),
	body: requestSchema,
	response: {
		200: z.object({
			data: responseSchema,
		}),
	},
};

type ReqParams = { Params: { id: string } };
type ReqBody = { Body: z.infer<typeof requestSchema> };
type RequestData = ReqParams & ReqBody;
type ResponseData = z.infer<typeof responseSchema>;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	if (!getRuntimeSettings().submissionsEnabled) throw new ErrorResponse("FORBIDDEN");
	const { id } = req.params;
	const session = req.userSession;
	if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

	const hasAdminPermission = (await verifyPermissions(session.user.id, { submissions: ["update"] })) || false;

	const submission = await db.query.submissions.findFirst({
		where: {
			id: id,
		},
	});
	if (!submission) throw new ErrorResponse("NOT_FOUND");

	const isOwner = submission.submitter_id === session.user.id;

	if (!hasAdminPermission && !isOwner) throw new ErrorResponse("FORBIDDEN");

	if (!hasAdminPermission && submission.status !== "pending")
		throw new ErrorResponse("BAD_REQUEST", { message: "Only pending submissions can be modified" });

	if (!hasAdminPermission && req.body.review_notes !== undefined) throw new ErrorResponse("FORBIDDEN", { message: "Cannot modify review notes" });
	try {
		const result = await db.transaction(async (tx) => {
			const updateFields: Record<string, unknown> = { updatedAt: new Date() };
			if (req.body.review_notes !== undefined) updateFields.review_notes = req.body.review_notes;
			if (req.body.submitter_note !== undefined) updateFields.submitter_note = req.body.submitter_note;

			await tx.update(submissions).set(updateFields).where(eq(submissions.id, id));

			if (req.body.station) {
				await tx.delete(proposedStations).where(eq(proposedStations.submission_id, id));
				await tx.insert(proposedStations).values({ ...req.body.station, submission_id: id } as typeof proposedStations.$inferInsert);
			}

			if (req.body.location) {
				await tx.delete(proposedLocations).where(eq(proposedLocations.submission_id, id));
				await tx.insert(proposedLocations).values({ ...req.body.location, submission_id: id } as typeof proposedLocations.$inferInsert);
			}

			if (req.body.cells) {
				const existingCells = await tx.query.proposedCells.findMany({
					where: {
						submission_id: id,
					},
					columns: { id: true },
				});
				const existingIds = existingCells.map((c) => c.id);

				if (existingIds.length > 0) {
					await Promise.all([
						tx.delete(proposedGSMCells).where(inArray(proposedGSMCells.proposed_cell_id, existingIds)),
						tx.delete(proposedUMTSCells).where(inArray(proposedUMTSCells.proposed_cell_id, existingIds)),
						tx.delete(proposedLTECells).where(inArray(proposedLTECells.proposed_cell_id, existingIds)),
						tx.delete(proposedNRCells).where(inArray(proposedNRCells.proposed_cell_id, existingIds)),
					]);
					await tx.delete(proposedCells).where(eq(proposedCells.submission_id, id));
				}

				for (const cell of req.body.cells) {
					const { details, ...cellData } = cell;
					const [base] = await tx
						.insert(proposedCells)
						.values({
							...cellData,
							submission_id: id,
							is_confirmed: false,
						})
						.returning();
					if (!base) throw new ErrorResponse("FAILED_TO_UPDATE");

					if (details && cell.operation !== "delete") {
						switch (cell.rat) {
							case "GSM":
								await tx.insert(proposedGSMCells).values({ ...(details as z.infer<typeof gsmInsertSchema>), proposed_cell_id: base.id });
								break;
							case "UMTS":
								await tx.insert(proposedUMTSCells).values({ ...(details as z.infer<typeof umtsInsertSchema>), proposed_cell_id: base.id });
								break;
							case "LTE":
								await tx.insert(proposedLTECells).values({ ...(details as z.infer<typeof lteInsertSchema>), proposed_cell_id: base.id });
								break;
							case "NR":
								await tx.insert(proposedNRCells).values({ ...(details as z.infer<typeof nrInsertSchema>), proposed_cell_id: base.id });
								break;
						}
					}
				}
			}

			const updated = await tx.query.submissions.findFirst({
				where: {
					id: id,
				},
			});
			if (!updated) throw new ErrorResponse("NOT_FOUND");

			const rawCells = await tx.query.proposedCells.findMany({
				where: {
					submission_id: id,
				},
				with: { gsm: true, umts: true, lte: true, nr: true },
			});

			const cells = rawCells.map(({ gsm, umts, lte, nr, ...base }) => ({
				...base,
				details: gsm ?? umts ?? lte ?? nr ?? null,
			}));

			return { ...updated, cells };
		});

		return res.send({ data: result });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("FAILED_TO_UPDATE");
	}
}

const updateSubmission: Route<RequestData, ResponseData> = {
	url: "/submissions/:id",
	method: "PATCH",
	schema: schemaRoute,
	handler,
};

export default updateSubmission;
