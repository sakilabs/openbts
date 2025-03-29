import { RateLimitService } from "../services/ratelimit.service.js";
import { redis } from "../database/redis.js";

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

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
			res.status(429).send({
				statusCode: 429,
				error: "Too Many Requests",
				message: "Too many requests, please try again later...",
			});
			return;
		}

		res.header("X-RateLimit-Limit", result.limit.toString());
		res.header("X-RateLimit-Remaining", result.remaining.toString());
		res.header("X-RateLimit-Reset", result.reset.toString());
	});
};
