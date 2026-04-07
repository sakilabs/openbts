import { notifications } from "@openbts/drizzle";
import { and, eq, isNull } from "drizzle-orm";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const schemaRoute = {
  response: {
    200: z.object({
      data: z.object({ updated: z.number() }),
    }),
  },
};

type ResponseData = { data: { updated: number } };

async function handler(req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const updated = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, session.user.id), isNull(notifications.readAt)))
    .returning({ id: notifications.id });

  return res.send({ data: { updated: updated.length } });
}

const readAllNotifications: Route<object, ResponseData> = {
  url: "/notifications/read-all",
  method: "PUT",
  schema: schemaRoute,
  handler,
};

export default readAllNotifications;
