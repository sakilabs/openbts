import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { redis } from "../../../../database/redis.js";
import { ErrorResponse } from "../../../../errors.js";
import { apikeys } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import { DEFAULT_TIER_LIMITS } from "../../../../services/ratelimit.service.js";

import type { TokenTier } from "../../../../interfaces/auth.interface.js";

const apiKeySchema = createSelectSchema(apikeys)
  .pick({ id: true, name: true, start: true, expiresAt: true, createdAt: true, enabled: true })
  .extend({
    rateLimit: z.object({
      used: z.number(),
      max: z.number().nullable(),
      window: z.number(),
      reset: z.number().nullable(),
    }),
  });

const schemaRoute = {
  response: {
    200: z.object({
      data: z.array(apiKeySchema),
    }),
  },
};

type ApiKeyResponse = z.infer<typeof apiKeySchema>;
type ResponseBody = ApiKeyResponse[];

async function handler(req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseBody>>) {
  const session = req.userSession;
  if (!session?.user) throw new ErrorResponse("UNAUTHORIZED");

  const keys = await db.query.apikeys.findMany({
    where: { referenceId: session.user.id },
    columns: {
      id: true,
      name: true,
      start: true,
      expiresAt: true,
      createdAt: true,
      enabled: true,
      metadata: true,
    },
  });

  const result: ApiKeyResponse[] = await Promise.all(
    keys.map(async (key) => {
      let tier: TokenTier = "basic";
      try {
        if (key.metadata) tier = (JSON.parse(key.metadata) as { tier?: TokenTier }).tier ?? "basic";
      } catch {
        // malformed metadata, default to basic
      }
      const limits = DEFAULT_TIER_LIMITS[tier] ?? DEFAULT_TIER_LIMITS.basic;

      const redisKey = `ratelimit:api:${key.id}`;
      const [countStr, ttl] = await Promise.all([redis.get(redisKey), redis.ttl(redisKey)]);
      const used = countStr ? Number.parseInt(countStr, 10) : 0;

      return {
        id: key.id,
        name: key.name,
        start: key.start,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
        enabled: key.enabled,
        rateLimit: {
          used,
          max: Number.isFinite(limits.max) ? limits.max : null,
          window: limits.window,
          reset: ttl > 0 ? Math.floor(Date.now() / 1000) + ttl : null,
        },
      };
    }),
  );

  return res.send({ data: result });
}

const getAccountApiKeys: Route<object, ResponseBody> = {
  url: "/account/api-keys",
  method: "GET",
  schema: schemaRoute,
  handler,
};

export default getAccountApiKeys;
