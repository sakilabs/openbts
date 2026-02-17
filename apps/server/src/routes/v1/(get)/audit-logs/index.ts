import { count, and, eq, gte, lte } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { AuditAction, auditLogs, users } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const auditLogSchema = createSelectSchema(auditLogs);
const userSchema = createSelectSchema(users).pick({ id: true, name: true, image: true, displayUsername: true });

const schemaRoute = {
  querystring: z.object({
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0),
    table_name: z.string().optional(),
    record_id: z.coerce.number().optional(),
    action: z.enum(AuditAction.enumValues).optional(),
    invoked_by: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
  response: {
    200: z.object({
      data: z.array(
        auditLogSchema.extend({
          user: userSchema.nullable(),
        }),
      ),
      totalCount: z.number(),
    }),
  },
};

type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };
type AuditLogWithUser = z.infer<typeof auditLogSchema> & {
  user: z.infer<typeof userSchema> | null;
};
type ResponseBody = { data: AuditLogWithUser[]; totalCount: number };

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResponseBody>>) {
  const { limit, offset, table_name, record_id, action, invoked_by, from, to, sort } = req.query;

  const conditions = [];
  if (table_name) conditions.push(eq(auditLogs.table_name, table_name));
  if (record_id !== undefined) conditions.push(eq(auditLogs.record_id, record_id));
  if (action) conditions.push(eq(auditLogs.action, action));
  if (invoked_by) conditions.push(eq(auditLogs.invoked_by, invoked_by));
  if (from) conditions.push(gte(auditLogs.createdAt, new Date(from)));
  if (to) conditions.push(lte(auditLogs.createdAt, new Date(to)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [totalCount] = await db.select({ count: count() }).from(auditLogs).where(whereClause);

  const rows = await db.query.auditLogs.findMany({
    limit,
    offset,
    orderBy: { createdAt: sort },
    where:
      conditions.length > 0
        ? {
            ...(table_name && { table_name }),
            ...(record_id !== undefined && { record_id }),
            ...(action && { action }),
            ...(invoked_by && { invoked_by }),
            ...(from || to
              ? {
                  createdAt: {
                    ...(from && { gte: new Date(from) }),
                    ...(to && { lte: new Date(to) }),
                  },
                }
              : {}),
          }
        : undefined,
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

  return res.send({ data: rows as AuditLogWithUser[], totalCount: totalCount?.count ?? 0 });
}

const getAuditLogs: Route<ReqQuery, ResponseBody> = {
  url: "/audit-logs",
  method: "GET",
  config: { permissions: ["read:audit_logs"] },
  schema: schemaRoute,
  handler,
};

export default getAuditLogs;
