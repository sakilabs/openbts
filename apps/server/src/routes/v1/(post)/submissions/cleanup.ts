import { inArray } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { createAuditLog } from "../../../../services/auditLog.service.js";
import { verifyPermissions } from "../../../../plugins/auth/utils.js";
import {
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

const schemaRoute = {
  response: {
    200: z.object({
      data: z.object({
        cleaned: z.number(),
      }),
    }),
  },
};

type ResponseData = { cleaned: number };

async function handler(req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const hasPermission = await verifyPermissions(session.user.id, { submissions: ["delete"] });
  if (!hasPermission) throw new ErrorResponse("INSUFFICIENT_PERMISSIONS");

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const staleSubmissions = await db.query.submissions.findMany({
    where: {
      createdAt: { lt: oneMonthAgo },
    },
    columns: { id: true },
  });

  if (staleSubmissions.length === 0) return res.send({ data: { cleaned: 0 } });

  const submissionIds = staleSubmissions.map((s) => s.id);

  await db.transaction(async (tx) => {
    const proposedCellRows = await tx.query.proposedCells.findMany({
      where: {
        submission_id: { in: submissionIds },
      },
      columns: { id: true },
    });
    const cellIds = proposedCellRows.map((c) => c.id);

    if (cellIds.length > 0) {
      await Promise.all([
        tx.delete(proposedGSMCells).where(inArray(proposedGSMCells.proposed_cell_id, cellIds)),
        tx.delete(proposedUMTSCells).where(inArray(proposedUMTSCells.proposed_cell_id, cellIds)),
        tx.delete(proposedLTECells).where(inArray(proposedLTECells.proposed_cell_id, cellIds)),
        tx.delete(proposedNRCells).where(inArray(proposedNRCells.proposed_cell_id, cellIds)),
      ]);
      await tx.delete(proposedCells).where(inArray(proposedCells.submission_id, submissionIds));
    }

    await tx.delete(proposedStations).where(inArray(proposedStations.submission_id, submissionIds));
    await tx.delete(proposedLocations).where(inArray(proposedLocations.submission_id, submissionIds));
  });

  await createAuditLog(
    {
      action: "submissions.cleanup",
      table_name: "submissions",
      record_id: null,
      new_values: null,
      metadata: { cleaned_count: submissionIds.length, older_than: oneMonthAgo.toISOString() },
    },
    req,
  );

  return res.send({ data: { cleaned: submissionIds.length } });
}

const cleanupSubmissions: Route<Record<string, never>, ResponseData> = {
  url: "/submissions/cleanup",
  method: "POST",
  config: { permissions: ["delete:submissions"] },
  schema: schemaRoute,
  handler,
};

export default cleanupSubmissions;
