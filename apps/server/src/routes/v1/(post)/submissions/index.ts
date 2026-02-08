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
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { getRuntimeSettings } from "../../../../services/settings.service.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const submissionsSelectSchema = createSelectSchema(submissions);

const submissionsInsertBase = createInsertSchema(submissions).omit({ createdAt: true, updatedAt: true, submitter_id: true });
const proposedStationInsert = createInsertSchema(proposedStations).omit({ createdAt: true, updatedAt: true, submission_id: true }).strict();
const proposedLocationInsert = createInsertSchema(proposedLocations).omit({ createdAt: true, updatedAt: true, submission_id: true }).strict();
const gsmInsertSchema = createInsertSchema(proposedGSMCells).omit({ proposed_cell_id: true });
const umtsInsertSchema = createInsertSchema(proposedUMTSCells).omit({ proposed_cell_id: true });
const lteInsertSchema = createInsertSchema(proposedLTECells).omit({ proposed_cell_id: true });
const nrInsertSchema = createInsertSchema(proposedNRCells).omit({ proposed_cell_id: true });
const proposedCellInsert = createInsertSchema(proposedCells)
	.omit({ createdAt: true, updatedAt: true, submission_id: true, is_confirmed: true, operation: true })
	.extend({
		operation: z.enum(["added", "updated", "removed"]).optional(),
		details: z.union([gsmInsertSchema, umtsInsertSchema, lteInsertSchema, nrInsertSchema]).optional(),
	})
	.strict();

const singleSubmissionSchema = z
	.object({
		station_id: submissionsInsertBase.shape.station_id.optional(),
		type: submissionsInsertBase.shape.type.optional(),
		submitter_note: z.string().optional(),
		station: proposedStationInsert.optional(),
		location: proposedLocationInsert.optional(),
		cells: z.array(proposedCellInsert).optional(),
	})
	.strict();

type SingleSubmission = z.infer<typeof singleSubmissionSchema>;

const requestSchema = z.union([singleSubmissionSchema, z.array(singleSubmissionSchema).min(1).max(10)]);

type ReqBody = { Body: z.infer<typeof requestSchema> };
const schemaRoute = {
	body: requestSchema,
	response: {
		200: z.object({
			data: z.array(submissionsSelectSchema),
		}),
	},
};

type ResponseData = z.infer<typeof submissionsSelectSchema>[];

function mapCellOperation(op: string): "add" | "update" | "delete" {
	switch (op) {
		case "updated":
			return "update";
		case "removed":
			return "delete";
		default:
			return "add";
	}
}

async function processSubmission(
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	input: SingleSubmission,
	userId: string,
): Promise<z.infer<typeof submissionsSelectSchema>> {
	const { station_id, type, submitter_note, station: stationData, location: locationData, cells: proposedCellsInput } = input;

	if ((type === "update" || type === "delete") && !station_id) throw new ErrorResponse("INVALID_QUERY", { message: "station_id is required for update and delete submissions" });

	if (station_id) {
		const stationId = Number(station_id);
		if (Number.isNaN(stationId)) throw new ErrorResponse("INVALID_QUERY");
		const station = await tx.query.stations.findFirst({ where: (fields, { eq }) => eq(fields.id, stationId) });
		if (!station) throw new ErrorResponse("NOT_FOUND", { message: "Station not found for the provided station_id" });
	}

	const [submission] = await tx
		.insert(submissions)
		.values({ submitter_id: userId, station_id: station_id ?? null, type, submitter_note: submitter_note ?? null })
		.returning();
	if (!submission) throw new ErrorResponse("FAILED_TO_CREATE");

	if (stationData) await tx.insert(proposedStations).values({ ...stationData, submission_id: submission.id });
	if (locationData) await tx.insert(proposedLocations).values({ ...locationData, submission_id: submission.id });

	if (proposedCellsInput && proposedCellsInput.length > 0) {
		for (const cell of proposedCellsInput) {
			const [base] = await tx
				.insert(proposedCells)
				.values({
					submission_id: submission.id,
					target_cell_id: cell.target_cell_id ?? null,
					station_id: cell.station_id ?? station_id ?? null,
					band_id: cell.band_id ?? null,
					rat: cell.rat ?? null,
					notes: cell.notes ?? null,
					is_confirmed: false,
					operation: mapCellOperation(cell.operation ?? "added"),
				})
				.returning();
			if (!base) throw new ErrorResponse("FAILED_TO_CREATE");

			if (cell.operation !== "removed") {
				switch (cell.rat) {
					case "GSM":
						{
							const details = cell.details as z.infer<typeof gsmInsertSchema>;
							await tx.insert(proposedGSMCells).values({ ...details, proposed_cell_id: base.id });
						}
						break;
					case "UMTS":
						{
							const details = cell.details as z.infer<typeof umtsInsertSchema>;
							await tx.insert(proposedUMTSCells).values({ ...details, proposed_cell_id: base.id });
						}
						break;
					case "LTE":
						{
							const details = cell.details as z.infer<typeof lteInsertSchema>;
							await tx.insert(proposedLTECells).values({ ...details, proposed_cell_id: base.id });
						}
						break;
					case "NR":
						{
							const details = cell.details as z.infer<typeof nrInsertSchema>;
							await tx.insert(proposedNRCells).values({ ...details, proposed_cell_id: base.id });
						}
						break;
				}
			}
		}
	}

	return submission;
}

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	if (!getRuntimeSettings().submissionsEnabled) throw new ErrorResponse("FORBIDDEN");
	const userSession = req.userSession;
	if (!userSession?.user?.id) throw new ErrorResponse("UNAUTHORIZED");
	const userId = userSession.user.id;
	if (Number.isNaN(userId)) throw new ErrorResponse("UNAUTHORIZED");

	const submissionInputs: SingleSubmission[] = Array.isArray(req.body) ? req.body : [req.body];

	try {
		const results = await db.transaction(async (tx) => {
			const created: z.infer<typeof submissionsSelectSchema>[] = [];
			for (const input of submissionInputs) {
				const submission = await processSubmission(tx, input, userId);
				created.push(submission);
			}
			return created;
		});

		return res.send({ data: results });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const createSubmission: Route<ReqBody, ResponseData> = {
	url: "/submissions",
	method: "POST",
	config: { permissions: ["write:submissions"] },
	schema: schemaRoute,
	handler,
};

export default createSubmission;
