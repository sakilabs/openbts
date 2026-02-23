import { RateLimitService } from "../services/ratelimit.service.js";
import { redis } from "../database/redis.js";
import { ErrorResponse } from "../errors.js";

import type { FastifyReply, FastifyRequest } from "fastify";
import type { FastifyZodInstance } from "../interfaces/fastify.interface.js";

declare module "fastify" {
  interface FastifyInstance {
    rateLimitService: RateLimitService;
  }
}

export const registerRateLimit = (fastify: FastifyZodInstance) => {
  const rateLimitService = new RateLimitService(redis);

  fastify.decorate("rateLimitService", rateLimitService);
  fastify.addHook("preHandler", async (req: FastifyRequest, res: FastifyReply) => {
    const result = await rateLimitService.processRequest(req);
    if (!result) {
      if (!req.userSession && !req.apiToken) throw new ErrorResponse("TOO_MANY_REQUESTS");
      return;
    }

    if (!result.allowed) {
      res.header("X-Retry-After", result.retryAfter?.toString() || "60");
      throw new ErrorResponse("TOO_MANY_REQUESTS");
    }

    res.header("X-RateLimit-Limit", result.limit.toString());
    res.header("X-RateLimit-Remaining", result.remaining.toString());
    res.header("X-RateLimit-Reset", result.reset.toString());
  });
};
