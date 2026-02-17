import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { auditLogs, users } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const auditLogSchema = createSelectSchema(auditLogs);
const userSchema = createSelectSchema(users).pick({ id: true, name: true, image: true, displayUsername: true });

const schemaRoute = {
  params: z.object({
    id: z.coerce.number(),
  }),
  response: {
    200: z.object({
      data: auditLogSchema.extend({
        user: userSchema.nullable(),
      }),
    }),
  },
};

type ReqParams = { Params: { id: number } };
type AuditLogWithUser = z.infer<typeof auditLogSchema> & {
  user: z.infer<typeof userSchema> | null;
};

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<AuditLogWithUser>>) {
  const { id } = req.params;

  const entry = await db.query.auditLogs.findFirst({
    where: { id },
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          image: true,
          displayUsername: true,
        },
      },
    },
  });

  if (!entry) throw new ErrorResponse("NOT_FOUND");

  return res.send({ data: entry as AuditLogWithUser });
}

const getAuditLog: Route<ReqParams, AuditLogWithUser> = {
  url: "/audit-logs/:id",
  method: "GET",
  config: { permissions: ["read:audit_logs"] },
  schema: schemaRoute,
  handler,
};

export default getAuditLog;
