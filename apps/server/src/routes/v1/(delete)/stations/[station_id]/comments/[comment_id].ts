import { stationComments } from "@openbts/drizzle";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { createAuditLog } from "../../../../../../services/auditLog.service.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { Route, EmptyResponse } from "../../../../../../interfaces/routes.interface.js";

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

  const comment = await db.query.stationComments.findFirst({
    where: {
      AND: [{ id: { eq: comment_id } }, { station_id: { eq: station_id } }],
    },
  });
  if (!comment) throw new ErrorResponse("NOT_FOUND");

  try {
    await db.delete(stationComments).where(eq(stationComments.id, comment_id));

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
  } catch {
    throw new ErrorResponse("FAILED_TO_DELETE");
  }
}

const deleteComment: Route<ReqParams, void> = {
  url: "/stations/:station_id/comments/:comment_id",
  method: "DELETE",
  schema: schemaRoute,
  config: { permissions: ["delete:comments"] },
  handler,
};

export default deleteComment;
