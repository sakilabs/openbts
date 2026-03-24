import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { pushSubscriptions } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
  body: z.object({ ukeUpdatesEnabled: z.boolean() }),
  response: {
    200: z.object({ data: z.object({ ok: z.boolean() }) }),
  },
};

type ReqBody = { Body: { ukeUpdatesEnabled: boolean } };
type ResponseData = { data: { ok: boolean } };

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  await db.update(pushSubscriptions).set({ ukeUpdatesEnabled: req.body.ukeUpdatesEnabled }).where(eq(pushSubscriptions.userId, session.user.id));

  return res.send({ data: { ok: true } });
}

const updatePushSubscribe: Route<ReqBody, ResponseData> = {
  url: "/push/subscribe",
  method: "PATCH",
  schema: schemaRoute,
  handler,
};

export default updatePushSubscribe;
