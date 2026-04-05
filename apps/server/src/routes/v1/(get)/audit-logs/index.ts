import { sql, count, and, or, eq, gte, lte, inArray, ilike } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { AuditAction, auditLogs, users } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const auditLogSchema = createSelectSchema(auditLogs);
const userSchema = createSelectSchema(users).pick({ id: true, name: true, image: true, username: true });

const schemaRoute = {
  querystring: z.object({
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0),
    table_name: z.string().optional(),
    record_id: z.string().optional(),
    actions: z.string().optional(),
    invoked_by: z.string().optional(),
    search: z.string().optional(),
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
  const { limit, offset, table_name, record_id, actions, invoked_by, search, from, to, sort } = req.query;

  const actionList = actions
    ? actions.split(",").filter((a): a is (typeof AuditAction.enumValues)[number] => AuditAction.enumValues.includes(a as never))
    : [];

  const buildConditions = (fields: typeof auditLogs) => {
    const conditions = [];
    if (table_name) conditions.push(eq(fields.table_name, table_name));
    if (record_id) conditions.push(ilike(sql`${fields.record_id}::text`, `%${record_id}%`));
    if (actionList.length === 1) conditions.push(eq(fields.action, actionList[0]!));
    else if (actionList.length > 1) conditions.push(inArray(fields.action, actionList));
    if (invoked_by) conditions.push(eq(fields.invoked_by, invoked_by));
    if (search) {
      const term = `%${search}%`;
      const subquery = db
        .select({ id: users.id })
        .from(users)
        .where(or(ilike(users.name, term), ilike(users.username, term), ilike(users.email, term)));
      conditions.push(inArray(fields.invoked_by, subquery));
    }
    if (from) conditions.push(gte(fields.createdAt, new Date(from)));
    if (to) conditions.push(lte(fields.createdAt, new Date(to)));
    return conditions;
  };

  const countConditions = buildConditions(auditLogs);
  const whereClause = countConditions.length > 0 ? and(...countConditions) : undefined;
  const [totalCount] = await db.select({ count: count() }).from(auditLogs).where(whereClause);

  const rows = await db.query.auditLogs.findMany({
    limit,
    offset,
    orderBy: { createdAt: sort },
    where: countConditions.length > 0 ? { RAW: (fields) => and(...buildConditions(fields)) ?? sql`true` } : undefined,
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          image: true,
          username: true,
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
