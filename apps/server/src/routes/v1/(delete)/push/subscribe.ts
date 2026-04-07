import { pushSubscriptions } from "@openbts/drizzle";
import { and, eq } from "drizzle-orm";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { EmptyResponse, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
  body: z.object({ endpoint: z.string() }),
};

type ReqBody = { Body: { endpoint: string } };

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<EmptyResponse>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.endpoint, req.body.endpoint), eq(pushSubscriptions.userId, session.user.id)));

  return res.status(204).send();
}

const unsubscribePush: Route<ReqBody, void> = {
  url: "/push/subscribe",
  method: "DELETE",
  schema: schemaRoute,
  handler,
};

export default unsubscribePush;
