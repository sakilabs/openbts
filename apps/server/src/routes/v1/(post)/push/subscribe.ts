import { and, eq, not } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { pushSubscriptions } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
  body: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
  response: {
    200: z.object({ data: z.object({ ok: z.boolean() }) }),
  },
};

type ReqBody = { Body: { endpoint: string; keys: { p256dh: string; auth: string } } };
type ResponseData = { data: { ok: boolean } };

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const { endpoint, keys } = req.body;

  await db
    .insert(pushSubscriptions)
    .values({
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    })
    .onConflictDoUpdate({
      target: [pushSubscriptions.endpoint],
      set: { userId: session.user.id },
    });

  const [existingSub] = await db
    .select({ preferences: pushSubscriptions.preferences })
    .from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, session.user.id), not(eq(pushSubscriptions.endpoint, endpoint))))
    .limit(1);

  if (existingSub && Object.keys(existingSub.preferences).length > 0)
    await db.update(pushSubscriptions).set({ preferences: existingSub.preferences }).where(eq(pushSubscriptions.endpoint, endpoint));

  return res.send({ data: { ok: true } });
}

const subscribePush: Route<ReqBody, ResponseData> = {
  url: "/push/subscribe",
  method: "POST",
  schema: schemaRoute,
  handler,
};

export default subscribePush;
