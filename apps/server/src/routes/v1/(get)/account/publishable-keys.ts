import { apikeys } from "@openbts/drizzle";
import { createSelectSchema } from "drizzle-orm/zod";
import type { FastifyRequest } from "fastify/types/request.js";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { redis } from "../../../../database/redis.js";
import { ErrorResponse } from "../../../../errors.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const publishableKeySchema = createSelectSchema(apikeys)
  .pick({ id: true, name: true, start: true, createdAt: true, enabled: true })
  .extend({
    rateLimit: z.object({
      used: z.number(),
      reset: z.number().nullable(),
    }),
  });

const schemaRoute = {
  response: {
    200: z.object({
      data: z.array(publishableKeySchema),
    }),
  },
};

type PublishableKeyResponse = z.infer<typeof publishableKeySchema>;
type ResponseBody = PublishableKeyResponse[];

async function handler(req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseBody>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const keys = await db.query.apikeys.findMany({
    where: { referenceId: session.user.id },
    columns: { id: true, name: true, start: true, createdAt: true, enabled: true, metadata: true },
  });

  const publishableKeys = keys.filter((key) => {
    try {
      if (!key.metadata) return false;
      return (JSON.parse(key.metadata) as { type?: string }).type === "publishable";
    } catch {
      return false;
    }
  });

  const result: PublishableKeyResponse[] = await Promise.all(
    publishableKeys.map(async (key) => {
      const redisKey = `ratelimit:pk:${key.id}`;
      const [countStr, ttl] = await Promise.all([redis.get(redisKey), redis.ttl(redisKey)]);
      const used = countStr ? Number.parseInt(countStr, 10) : 0;

      return {
        id: key.id,
        name: key.name,
        start: key.start,
        createdAt: key.createdAt,
        enabled: key.enabled,
        rateLimit: {
          used,
          reset: ttl > 0 ? Math.floor(Date.now() / 1000) + ttl : null,
        },
      };
    }),
  );

  return res.send({ data: result });
}

const getAccountPublishableKeys: Route<object, ResponseBody> = {
  url: "/account/publishable-keys",
  method: "GET",
  schema: schemaRoute,
  handler,
};

export default getAccountPublishableKeys;
