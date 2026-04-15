import { apikeys } from "@openbts/drizzle";
import { fromNodeHeaders } from "better-auth/node";
import { eq } from "drizzle-orm";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import { PK_KEYS_LIMIT } from "../../../../constants.js";
import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import { auth } from "../../../../plugins/betterauth.plugin.js";

const schemaRoute = {
  body: z.object({
    name: z.string().min(1).max(64),
  }),
  response: {
    201: z.object({
      data: z.object({
        id: z.string(),
        name: z.string().nullable(),
        key: z.string(),
        start: z.string().nullable(),
        createdAt: z.date(),
      }),
    }),
  },
};

type ReqBody = { Body: z.infer<typeof schemaRoute.body> };
type ResponseBody = {
  id: string;
  name: string | null;
  key: string;
  start: string | null;
  createdAt: Date;
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseBody>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const allKeys = await db.query.apikeys.findMany({
    where: { referenceId: session.user.id },
    columns: { metadata: true },
  });

  const existingCount = allKeys.filter((k) => {
    try {
      return k.metadata && (JSON.parse(k.metadata) as { type?: string }).type === "publishable";
    } catch {
      return false;
    }
  }).length;
  if (existingCount >= PK_KEYS_LIMIT) throw new ErrorResponse("BAD_REQUEST", { message: `Publishable key limit of ${PK_KEYS_LIMIT} reached.` });

  const result = await auth.api.createApiKey({
    body: { name: req.body.name, prefix: "pk_" },
    headers: fromNodeHeaders(req.headers),
  });

  await db
    .update(apikeys)
    .set({ metadata: JSON.stringify({ type: "publishable" }) })
    .where(eq(apikeys.id, result.id));

  return res.status(201).send({
    data: {
      id: result.id,
      name: result.name ?? null,
      key: result.key,
      start: result.start ?? null,
      createdAt: result.createdAt,
    },
  });
}

const postAccountPublishableKeys: Route<ReqBody, ResponseBody> = {
  url: "/account/publishable-keys",
  method: "POST",
  schema: schemaRoute,
  handler,
};

export default postAccountPublishableKeys;
