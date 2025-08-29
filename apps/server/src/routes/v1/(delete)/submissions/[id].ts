import { eq, inArray } from "drizzle-orm";
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
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { verifyPermissions } from "../../../../plugins/auth/utils.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { IdParams, Route, SuccessResponse } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
	params: z.object({
		id: z.number(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
		}),
	},
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<SuccessResponse>) {
	const { id } = req.params;
	const session = req.userSession;
	if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");
	const userId = session.user.id;

	const hasAdminPermission = (await verifyPermissions(session.user.id, { submissions: ["delete"] })) || false;

	const submission = await db.query.submissions.findFirst({
		where: (fields, { eq }) => eq(fields.id, id),
		columns: {
			id: true,
			submitter_id: true,
		},
	});

	if (!submission) throw new ErrorResponse("NOT_FOUND");

	if (!hasAdminPermission && submission.submitter_id !== userId) throw new ErrorResponse("FORBIDDEN");

	try {
		await db.transaction(async (tx) => {
			const cellsBase = await tx.query.proposedCells.findMany({
				where: (fields, { eq }) => eq(fields.submission_id, id),
				columns: { id: true },
			});
			const proposedCellIds = cellsBase.map((c) => c.id).filter((n): n is number => n !== null && n !== undefined);

			if (proposedCellIds.length > 0) {
				await Promise.all([
					tx.delete(proposedGSMCells).where(inArray(proposedGSMCells.proposed_cell_id, proposedCellIds)),
					tx.delete(proposedUMTSCells).where(inArray(proposedUMTSCells.proposed_cell_id, proposedCellIds)),
					tx.delete(proposedLTECells).where(inArray(proposedLTECells.proposed_cell_id, proposedCellIds)),
					tx.delete(proposedNRCells).where(inArray(proposedNRCells.proposed_cell_id, proposedCellIds)),
				]);
			}

			await tx.delete(proposedCells).where(eq(proposedCells.submission_id, id));
			await Promise.all([
				tx.delete(proposedStations).where(eq(proposedStations.submission_id, id)),
				tx.delete(proposedLocations).where(eq(proposedLocations.submission_id, id)),
			]);

			await tx.delete(submissions).where(eq(submissions.id, id));
		});
	} catch {
		throw new ErrorResponse("FAILED_TO_DELETE");
	}

	return res.send({
		success: true,
	});
}

const deleteSubmission: Route<IdParams> = {
	url: "/submissions/:id",
	method: "DELETE",
	schema: schemaRoute,
	handler,
};

export default deleteSubmission;
