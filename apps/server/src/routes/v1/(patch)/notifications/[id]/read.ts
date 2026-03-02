import { and, eq } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";
import { notifications } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const notificationSchema = createSelectSchema(notifications);

const schemaRoute = {
  params: z.object({ id: z.string() }),
  response: {
    200: z.object({ data: notificationSchema }),
  },
};

type ReqParams = { Params: { id: string } };
type ResponseData = { data: z.infer<typeof notificationSchema> };

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const { id } = req.params;

  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)))
    .returning();

  if (!updated) throw new ErrorResponse("NOT_FOUND");

  return res.send({ data: updated });
}

const readNotification: Route<ReqParams, ResponseData> = {
  url: "/notifications/:id/read",
  method: "PATCH",
  schema: schemaRoute,
  handler,
};

export default readNotification;
