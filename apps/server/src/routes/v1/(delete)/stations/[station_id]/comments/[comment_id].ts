import path from "node:path";
import fs from "node:fs/promises";

import { stationComments, attachments } from "@openbts/drizzle";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { createAuditLog } from "../../../../../../services/auditLog.service.js";
import { verifyPermissions } from "../../../../../../plugins/auth/utils.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { Route, EmptyResponse } from "../../../../../../interfaces/routes.interface.js";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

const schemaRoute = {
  params: z.object({
    station_id: z.coerce.number<number>(),
    comment_id: z.coerce.number<number>(),
  }),
};
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<EmptyResponse>) {
  const { station_id, comment_id } = req.params;

  if (Number.isNaN(station_id) || Number.isNaN(comment_id)) throw new ErrorResponse("INVALID_QUERY");

  const userId = req.userSession?.user.id;
  if (!userId) throw new ErrorResponse("UNAUTHORIZED");

  const comment = await db.query.stationComments.findFirst({
    where: {
      AND: [{ id: { eq: comment_id } }, { station_id: { eq: station_id } }],
    },
  });
  if (!comment) throw new ErrorResponse("NOT_FOUND");

  const isPrivileged = await verifyPermissions(userId, { comments: ["delete"] });
  if (comment.user_id !== userId && !isPrivileged) throw new ErrorResponse("FORBIDDEN");

  try {
    const commentAttachments = comment.attachments ?? [];

    await db.delete(stationComments).where(eq(stationComments.id, comment_id));

    if (commentAttachments.length > 0) {
      const uuids = commentAttachments.map((a) => a.uuid);
      await db.delete(attachments).where(inArray(attachments.uuid, uuids));
      await Promise.all(
        uuids.map(async (uuid) => {
          try {
            await fs.unlink(path.join(UPLOAD_DIR, `${uuid}.webp`));
          } catch {}
        }),
      );
    }

    await createAuditLog(
      {
        action: "station_comments.delete",
        table_name: "station_comments",
        record_id: comment_id,
        old_values: comment,
        new_values: null,
      },
      req,
    );

    return res.status(204).send();
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("FAILED_TO_DELETE");
  }
}

const deleteComment: Route<ReqParams, void> = {
  url: "/stations/:station_id/comments/:comment_id",
  method: "DELETE",
  schema: schemaRoute,
  handler,
};

export default deleteComment;
