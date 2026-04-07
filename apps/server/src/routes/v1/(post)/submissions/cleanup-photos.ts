import { attachments, submissionPhotos } from "@openbts/drizzle";
import { inArray } from "drizzle-orm";
import type { FastifyRequest } from "fastify/types/request.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import { verifyPermissions } from "../../../../plugins/auth/utils.js";
import { createAuditLog } from "../../../../services/auditLog.service.js";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

const schemaRoute = {
  response: {
    200: z.object({
      data: z.object({
        deleted: z.number(),
      }),
    }),
  },
};

type ResponseData = { deleted: number };

async function handler(req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const hasPermission = await verifyPermissions(session.user.id, { submissions: ["delete"] });
  if (!hasPermission) throw new ErrorResponse("INSUFFICIENT_PERMISSIONS");

  const rejectedSubmissions = await db.query.submissions.findMany({
    where: {
      status: "rejected",
    },
    columns: { id: true },
  });

  if (rejectedSubmissions.length === 0) return res.send({ data: { deleted: 0 } });

  const submissionIds = rejectedSubmissions.map((s) => s.id);

  const photos = await db.query.submissionPhotos.findMany({
    where: {
      submission_id: { in: submissionIds },
    },
    columns: { id: true, attachment_id: true },
  });

  if (photos.length === 0) return res.send({ data: { deleted: 0 } });

  const photoIds = photos.map((p) => p.id);
  const attachmentIds = photos.map((p) => p.attachment_id);

  const attachmentRows = await db.query.attachments.findMany({
    where: {
      id: { in: attachmentIds },
    },
    columns: { id: true, uuid: true },
  });

  await db.delete(submissionPhotos).where(inArray(submissionPhotos.id, photoIds));
  await db.delete(attachments).where(inArray(attachments.id, attachmentIds));

  await Promise.all(attachmentRows.map(({ uuid }) => fs.unlink(path.join(UPLOAD_DIR, `${uuid}.webp`)).catch(() => {})));

  await createAuditLog(
    {
      action: "submission_photos.delete",
      table_name: "submission_photos",
      record_id: null,
      new_values: null,
      metadata: { deleted_count: attachmentRows.length },
    },
    req,
  );

  return res.send({ data: { deleted: attachmentRows.length } });
}

const cleanupRejectedPhotos: Route<Record<string, never>, ResponseData> = {
  url: "/submissions/cleanup-photos",
  method: "POST",
  config: { permissions: ["delete:submissions"] },
  schema: schemaRoute,
  handler,
};

export default cleanupRejectedPhotos;
