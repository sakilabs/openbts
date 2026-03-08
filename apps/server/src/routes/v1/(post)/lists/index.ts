import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";
import { count, eq } from "drizzle-orm";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { getRuntimeSettings } from "../../../../services/settings.service.js";
import { createAuditLog } from "../../../../services/auditLog.service.js";
import { userLists } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const insertSchema = createInsertSchema(userLists, {
  stations: z.array(z.number()),
  radiolines: z.array(z.number()),
}).omit({
  uuid: true,
  createdAt: true,
  updatedAt: true,
  created_by: true,
});
const selectSchema = createSelectSchema(userLists);

const schemaRoute = {
  body: insertSchema,
  response: {
    200: z.object({
      data: selectSchema,
    }),
  },
};

type ReqBody = { Body: z.infer<typeof insertSchema> };
type ResponseData = z.infer<typeof selectSchema>;

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
  if (!getRuntimeSettings().enableUserLists) throw new ErrorResponse("FORBIDDEN");
  if (!req.userSession) throw new ErrorResponse("UNAUTHORIZED");

  const userId = req.userSession.user.id;

  const [listCountRow] = await db.select({ count: count() }).from(userLists).where(eq(userLists.created_by, userId));
  if ((listCountRow?.count ?? 0) >= 10) throw new ErrorResponse("BAD_REQUEST", { message: "You have reached the maximum limit of 10 lists" });

  const [created] = await db
    .insert(userLists)
    .values({
      ...req.body,
      radiolines: req.body.radiolines ?? [],
      created_by: userId,
    })
    .returning()
    .catch(() => {
      throw new ErrorResponse("FAILED_TO_CREATE");
    });
  if (!created) throw new ErrorResponse("FAILED_TO_CREATE");

  await createAuditLog({ action: "user_lists.create", table_name: "user_lists", record_id: created.id, new_values: created }, req);

  return res.send({ data: created });
}

const createList: Route<ReqBody, ResponseData> = {
  url: "/lists",
  method: "POST",
  config: { permissions: ["create:user_lists"] },
  schema: schemaRoute,
  handler,
};

export default createList;
