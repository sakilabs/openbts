import { createRateLimit, globalRateLimit } from "../hooks/ratelimit.hook.js";

import type { FastifyInstance } from "fastify";
import type { RateLimitOptions } from "../hooks/ratelimit.hook.js";

declare module "fastify" {
	interface FastifyInstance {
		rateLimit: (opts?: Partial<RateLimitOptions>) => ReturnType<typeof createRateLimit>;
	}
}

export const registerRateLimit = (fastify: FastifyInstance) => {
	fastify.decorate("rateLimit", createRateLimit);
	fastify.addHook("onRequest", globalRateLimit);
};
