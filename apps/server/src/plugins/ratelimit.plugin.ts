import { RateLimitService } from "../services/ratelimit.service.js";
import { redis } from "../database/redis.js";

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ErrorResponse } from "errors.js";

declare module "fastify" {
	interface FastifyInstance {
		rateLimitService: RateLimitService;
	}
}

export const registerRateLimit = (fastify: FastifyInstance) => {
	const rateLimitService = new RateLimitService(redis);

	fastify.decorate("rateLimitService", rateLimitService);
	fastify.addHook("onRequest", async (req: FastifyRequest, res: FastifyReply) => {
		const result = await rateLimitService.processRequest(req);

		if (!result) return;

		if (!result.allowed) {
			res.header("X-Retry-After", result.retryAfter?.toString() || "60");
			throw new ErrorResponse("TOO_MANY_REQUESTS");
		}

		res.header("X-RateLimit-Limit", result.limit.toString());
		res.header("X-RateLimit-Remaining", result.remaining.toString());
		res.header("X-RateLimit-Reset", result.reset.toString());
	});
};
