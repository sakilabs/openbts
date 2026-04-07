import { submissions } from "@openbts/drizzle";
import { eq } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";
import { verifyPermissions } from "../../../../../plugins/auth/utils.js";
import { createAuditLog } from "../../../../../services/auditLog.service.js";
import { createAndDeliverNotification } from "../../../../../services/notification.service.js";
import { getRuntimeSettings } from "../../../../../services/settings.service.js";
import { logger } from "../../../../../utils/logger.js";

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
  const submission = await db.query.submissions.findFirst({
    where: {
      id: id,
    },
  });
  if (!submission) throw new ErrorResponse("NOT_FOUND");
  if (submission.status !== "pending") throw new ErrorResponse("BAD_REQUEST", { message: "Only pending submissions can be rejected" });

  try {
    const now = new Date();
    const [result] = await db
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
    if (!result) throw new ErrorResponse("FAILED_TO_UPDATE");

    await createAuditLog(
      {
        action: "submissions.reject",
        table_name: "submissions",
        record_id: null,
        old_values: submission,
        new_values: result,
        metadata: { submission_id: id },
      },
      req,
    );

    const stationStringId = submission.station_id
      ? ((await db.query.stations.findFirst({ where: { id: submission.station_id }, columns: { station_id: true } }))?.station_id ?? null)
      : null;

    void createAndDeliverNotification({
      userId: submission.submitter_id,
      type: "submission_rejected",
      submissionId: id,
      metadata: {
        ...(stationStringId ? { station_id: stationStringId } : {}),
        ...(result.review_notes ? { reviewer_note: result.review_notes.slice(0, 200) } : {}),
      },
      actionUrl: "/account/submissions",
    }).catch((e) => logger.error("Failed to send notification", { error: e }));

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
