import { count, eq, isNull, and } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { notifications } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const notificationSchema = createSelectSchema(notifications);

const schemaRoute = {
  querystring: z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0),
  }),
  response: {
    200: z.object({
      data: z.array(notificationSchema),
      totalUnread: z.number(),
      total: z.number(),
    }),
  },
};

type ReqQuery = { Querystring: { limit: number; offset: number } };
type ResponseData = { data: z.infer<typeof notificationSchema>[]; totalUnread: number; total: number };

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const { limit, offset } = req.query;
  const userId = session.user.id;

  const [rows, [totalRow], [unreadRow]] = await Promise.all([
    db.query.notifications.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      limit,
      offset,
    }),
    db.select({ total: count() }).from(notifications).where(eq(notifications.userId, userId)),
    db
      .select({ total: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
  ]);

  return res.send({
    data: rows,
    total: totalRow?.total ?? 0,
    totalUnread: unreadRow?.total ?? 0,
  });
}

const getNotifications: Route<ReqQuery, ResponseData> = {
  url: "/notifications",
  method: "GET",
  schema: schemaRoute,
  handler,
};

export default getNotifications;
