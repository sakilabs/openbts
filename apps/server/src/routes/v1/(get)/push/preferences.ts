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
    200: z.object({
      data: z.object({
        ukeUpdates: z.boolean(),
        submissionUpdates: z.boolean(),
        newSubmission: z.boolean(),
      }),
    }),
  },
};

type ResponseData = { data: { ukeUpdates: boolean; submissionUpdates: boolean; newSubmission: boolean } };

async function handler(req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const subs = await db
    .select({ preferences: pushSubscriptions.preferences })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, session.user.id));

  return res.send({
    data: {
      ukeUpdates: subs.some((s) => s.preferences.ukeUpdates === true),
      submissionUpdates: !subs.some((s) => s.preferences.submissionUpdates === false),
      newSubmission: !subs.some((s) => s.preferences.newSubmission === false),
    },
  });
}

const getPushPreferences: Route<object, ResponseData> = {
  url: "/push/preferences",
  method: "GET",
  schema: schemaRoute,
  handler,
};

export default getPushPreferences;
