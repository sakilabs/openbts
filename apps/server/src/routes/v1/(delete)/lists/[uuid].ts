import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { getRuntimeSettings } from "../../../../services/settings.service.js";
import { verifyPermissions } from "../../../../plugins/auth/utils.js";
import { userLists } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { EmptyResponse, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
  params: z.object({
    uuid: z.string(),
  }),
};

type ReqParams = { Params: { uuid: string } };

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<EmptyResponse>) {
  if (!getRuntimeSettings().enableUserLists) throw new ErrorResponse("FORBIDDEN");
  if (!req.userSession) throw new ErrorResponse("UNAUTHORIZED");

  const { uuid } = req.params;
  const userId = req.userSession.user.id;

  const [list, isAdmin] = await Promise.all([
    db.query.userLists.findFirst({ where: { uuid } }),
    verifyPermissions(userId, { user_lists: ["delete"] }),
  ]);
  if (!list) throw new ErrorResponse("NOT_FOUND");
  if (!isAdmin && list.created_by !== userId) throw new ErrorResponse("FORBIDDEN");

  await db
    .delete(userLists)
    .where(eq(userLists.uuid, uuid))
    .catch(() => {
      throw new ErrorResponse("FAILED_TO_DELETE");
    });

  return res.status(204).send();
}

const deleteList: Route<ReqParams, void> = {
  url: "/lists/:uuid",
  method: "DELETE",
  config: { permissions: ["delete:lists"] },
  schema: schemaRoute,
  handler,
};

export default deleteList;
