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

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const submissionsSelectSchema = createSelectSchema(submissions);

const submissionsInsertBase = createInsertSchema(submissions).omit({ createdAt: true, updatedAt: true, submitter_id: true });
const proposedStationInsert = createInsertSchema(proposedStations).omit({ createdAt: true, updatedAt: true, submission_id: true }).strict();
const proposedLocationInsert = createInsertSchema(proposedLocations).omit({ createdAt: true, updatedAt: true, submission_id: true }).strict();
const gsmInsertSchema = createInsertSchema(proposedGSMCells).omit({ createdAt: true, updatedAt: true, proposed_cell_id: true });
const umtsInsertSchema = createInsertSchema(proposedUMTSCells).omit({ createdAt: true, updatedAt: true, proposed_cell_id: true });
const lteInsertSchema = createInsertSchema(proposedLTECells).omit({ createdAt: true, updatedAt: true, proposed_cell_id: true });
const nrInsertSchema = createInsertSchema(proposedNRCells).omit({ createdAt: true, updatedAt: true, proposed_cell_id: true });
const proposedCellInsert = createInsertSchema(proposedCells)
	.omit({ createdAt: true, updatedAt: true, submission_id: true })
	.extend({ details: z.union([gsmInsertSchema, umtsInsertSchema, lteInsertSchema, nrInsertSchema]) })
	.strict();

const requestSchema = z
	.object({
		station_id: submissionsInsertBase.shape.station_id.optional(),
		type: submissionsInsertBase.shape.type.optional(),
		proposedStation: proposedStationInsert.optional(),
		proposedLocation: proposedLocationInsert.optional(),
		cells: z.array(proposedCellInsert).optional(),
	})
	.strict();

type ReqBody = { Body: z.infer<typeof requestSchema> };
const schemaRoute = {
	body: requestSchema,
	response: {
		200: z.object({
			data: submissionsSelectSchema,
		}),
	},
};

type ResponseData = z.infer<typeof submissionsSelectSchema>;

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	try {
		const userSession = req.userSession;
		if (!userSession?.user?.id) throw new ErrorResponse("UNAUTHORIZED");
		const userId = userSession.user.id;
		if (Number.isNaN(userId)) throw new ErrorResponse("UNAUTHORIZED");

		const { station_id, type, proposedStation, proposedLocation, cells: proposedCellsInput } = req.body;

		if (station_id) {
			const stationId = Number(station_id);
			if (Number.isNaN(stationId)) throw new ErrorResponse("INVALID_QUERY");
			const station = await db.query.stations.findFirst({ where: (fields, { eq }) => eq(fields.id, stationId) });
			if (!station) throw new ErrorResponse("NOT_FOUND", { message: "Station not found for the provided station_id" });
		}

		const [submission] = await db
			.insert(submissions)
			.values({ submitter_id: userId, station_id: station_id ?? null, type })
			.returning();
		if (!submission) throw new ErrorResponse("FAILED_TO_CREATE");

		if (proposedStation) await db.insert(proposedStations).values({ ...proposedStation, submission_id: submission.id });
		if (proposedLocation) await db.insert(proposedLocations).values({ ...proposedLocation, submission_id: submission.id });

		if (proposedCellsInput && proposedCellsInput.length > 0) {
			for (const cell of proposedCellsInput) {
				const [base] = await db
					.insert(proposedCells)
					.values({
						submission_id: submission.id,
						target_cell_id: cell.target_cell_id ?? null,
						station_id: cell.station_id ?? station_id ?? null,
						band_id: cell.band_id,
						rat: cell.rat,
						notes: cell.notes ?? null,
						is_confirmed: cell.is_confirmed ?? null,
					})
					.returning();
				if (!base) throw new ErrorResponse("FAILED_TO_CREATE");

				switch (cell.rat) {
					case "GSM":
						{
							const details = cell.details as z.infer<typeof gsmInsertSchema>;
							await db.insert(proposedGSMCells).values({ ...details, proposed_cell_id: base.id });
						}
						break;
					case "UMTS":
						{
							const details = cell.details as z.infer<typeof umtsInsertSchema>;
							await db.insert(proposedUMTSCells).values({ ...details, proposed_cell_id: base.id });
						}
						break;
					case "LTE":
						{
							const details = cell.details as z.infer<typeof lteInsertSchema>;
							await db.insert(proposedLTECells).values({ ...details, proposed_cell_id: base.id });
						}
						break;
					case "NR":
						{
							const details = cell.details as z.infer<typeof nrInsertSchema>;
							await db.insert(proposedNRCells).values({ ...details, proposed_cell_id: base.id });
						}
						break;
				}
			}
		}

		return res.send({ data: submission });
	} catch {
		throw new ErrorResponse("FAILED_TO_CREATE");
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
