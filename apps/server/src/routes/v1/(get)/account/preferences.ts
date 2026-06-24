import type { CloudPreferences } from "@openbts/drizzle";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import { cloudPreferencesSchema, normalizeCloudPreferences } from "../../../../lib/accountPreferences.js";

const schemaRoute = {
  response: {
    200: z.object({
      data: cloudPreferencesSchema,
    }),
  },
};

async function handler(req: FastifyRequest, res: ReplyPayload<JSONBody<CloudPreferences>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const user = await db.query.users.findFirst({
    where: { id: session.user.id },
    columns: { cloudPreferences: true },
  });

  if (!user) throw new ErrorResponse("NOT_FOUND");

  return res.send({ data: normalizeCloudPreferences(user.cloudPreferences) });
}

const getAccountPreferences: Route<object, CloudPreferences> = {
  url: "/account/preferences",
  method: "GET",
  schema: schemaRoute,
  handler,
};

export default getAccountPreferences;
