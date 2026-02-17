import { eq, inArray } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";
import { getRuntimeSettings } from "../../../../../services/settings.service.js";
import { createAuditLog } from "../../../../../services/auditLog.service.js";
import { verifyPermissions } from "../../../../../plugins/auth/utils.js";
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
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const submissionsSelectSchema = createSelectSchema(submissions);

const schemaRoute = {
  params: z.object({
    id: z.coerce.string<string>(),
  }),
  body: z
    .object({
      review_notes: z.string().nullable().optional(),
    })
    .optional(),
  response: {
    200: z.object({
      data: submissionsSelectSchema,
    }),
  },
};

type ReqParams = { Params: { id: string } };
type ReqBody = { Body: { review_notes?: string } | undefined };
type RequestData = ReqParams & ReqBody;
type ResponseData = z.infer<typeof submissionsSelectSchema>;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
  if (!getRuntimeSettings().submissionsEnabled) throw new ErrorResponse("FORBIDDEN");
  const { id } = req.params;
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const hasPermission = await verifyPermissions(session.user.id, { submissions: ["update"] });
  if (!hasPermission) throw new ErrorResponse("INSUFFICIENT_PERMISSIONS");

  try {
    const result = await db.transaction(async (tx) => {
      const submission = await tx.query.submissions.findFirst({
        where: {
          id: id,
        },
      });
      if (!submission) throw new ErrorResponse("NOT_FOUND");
      if (submission.status !== "pending") throw new ErrorResponse("BAD_REQUEST", { message: "Only pending submissions can be rejected" });

      const proposedCellRows = await tx.query.proposedCells.findMany({
        where: {
          submission_id: id,
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
        await tx.delete(proposedCells).where(eq(proposedCells.submission_id, id));
      }

      await tx.delete(proposedStations).where(eq(proposedStations.submission_id, id));
      await tx.delete(proposedLocations).where(eq(proposedLocations.submission_id, id));

      const now = new Date();
      const [updated] = await tx
        .update(submissions)
        .set({
          status: "rejected",
          reviewer_id: session.user.id,
          review_notes: req.body?.review_notes ?? submission.review_notes,
          reviewed_at: now,
          updatedAt: now,
        })
        .where(eq(submissions.id, id))
        .returning();
      if (!updated) throw new ErrorResponse("FAILED_TO_UPDATE");

      return updated;
    });

    await createAuditLog(
      {
        action: "submissions.reject",
        table_name: "submissions",
        record_id: undefined,
        old_values: null,
        new_values: result,
        metadata: { submission_id: id },
      },
      req,
    );

    return res.send({ data: result });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("INTERNAL_SERVER_ERROR");
  }
}

const rejectSubmission: Route<RequestData, ResponseData> = {
  url: "/submissions/:id/reject",
  method: "POST",
  config: { permissions: ["update:submissions"] },
  schema: schemaRoute,
  handler,
};

export default rejectSubmission;
