import { eq } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { pushSubscriptions } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
  response: {
    200: z.object({ data: z.object({ ukeUpdatesEnabled: z.boolean() }) }),
  },
};

type ResponseData = { data: { ukeUpdatesEnabled: boolean } };

async function handler(req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const subs = await db
    .select({ ukeUpdatesEnabled: pushSubscriptions.ukeUpdatesEnabled })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, session.user.id));

  const ukeUpdatesEnabled = subs.some((s) => s.ukeUpdatesEnabled);
  return res.send({ data: { ukeUpdatesEnabled } });
}

const getPushPreferences: Route<object, ResponseData> = {
  url: "/push/preferences",
  method: "GET",
  schema: schemaRoute,
  handler,
};

export default getPushPreferences;
