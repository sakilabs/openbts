import { users } from "@openbts/drizzle";
import { and, ilike, or } from "drizzle-orm";
import { createSelectSchema } from "drizzle-orm/zod";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const userSchema = createSelectSchema(users).pick({
  id: true,
  name: true,
  username: true,
  image: true,
});

const schemaRoute = {
  querystring: z.object({
    limit: z.coerce.number().min(1).max(100).default(50),
    search: z.string().optional(),
  }),
  response: {
    200: z.object({
      data: z.array(userSchema),
      total: z.number(),
    }),
  },
};

type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };
type ResponseBody = { data: z.infer<typeof userSchema>[]; total: number };

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResponseBody>>) {
  const session = req.userSession;
  const apiToken = req.apiToken;
  if (!session?.user && !apiToken) throw new ErrorResponse("UNAUTHORIZED");

  const userId = session?.user?.id;
  if (!userId) throw new ErrorResponse("UNAUTHORIZED");

  const { limit, search } = req.query;

  const conditions = [];
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(or(ilike(users.name, pattern), ilike(users.username, pattern)));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
    })
    .from(users)
    .where(whereClause)
    .orderBy(users.name)
    .limit(limit);

  return res.send({ data: rows, total: rows.length });
}

const getAdminUsersSearch: Route<ReqQuery, ResponseBody> = {
  url: "/admin/users/search",
  method: "GET",
  config: { permissions: ["search:user"] },
  schema: schemaRoute,
  handler,
};

export default getAdminUsersSearch;
