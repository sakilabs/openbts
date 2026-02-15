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
import { getRuntimeSettings } from "../../../../services/settings.service.js";
import { verifyPermissions } from "../../../../plugins/auth/utils.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { Route, EmptyResponse } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
	params: z.object({
		id: z.coerce.string<string>(),
	}),
};

type ReqParams = { Params: { id: string } };
async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<EmptyResponse>) {
	if (!getRuntimeSettings().submissionsEnabled) throw new ErrorResponse("FORBIDDEN");
	const { id } = req.params;
	const session = req.userSession;
	if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");
	const userId = session.user.id;

	const hasAdminPermission = (await verifyPermissions(session.user.id, { submissions: ["delete"] })) || false;

	const submission = await db.query.submissions.findFirst({
		where: {
			id: id,
		},
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
				where: {
					submission_id: id,
				},
				columns: { id: true },
			});
			const proposed_cell_ids = cellsBase.map((c) => c.id).filter((n): n is number => n !== null && n !== undefined);

			if (proposed_cell_ids.length > 0) {
				await Promise.all([
					tx.delete(proposedGSMCells).where(inArray(proposedGSMCells.proposed_cell_id, proposed_cell_ids)),
					tx.delete(proposedUMTSCells).where(inArray(proposedUMTSCells.proposed_cell_id, proposed_cell_ids)),
					tx.delete(proposedLTECells).where(inArray(proposedLTECells.proposed_cell_id, proposed_cell_ids)),
					tx.delete(proposedNRCells).where(inArray(proposedNRCells.proposed_cell_id, proposed_cell_ids)),
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

	return res.status(204).send();
}

const deleteSubmission: Route<ReqParams, void> = {
	url: "/submissions/:id",
	method: "DELETE",
	schema: schemaRoute,
	handler,
};

export default deleteSubmission;
