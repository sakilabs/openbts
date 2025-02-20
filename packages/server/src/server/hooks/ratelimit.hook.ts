import { i18n } from "../i18n/index.js";
import { redis } from "../database/redis.js";
import { generateFingerprint } from "../utils/fingerprint.js";

import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction, onRequestHookHandler } from "fastify";
import type { TokenTier, User, UserRole } from "../interfaces/auth.interface.js";

export type RateLimitTier = {
	maxReq: number;
	windowMs: number;
};

export interface RateLimitOptions {
	windowMs?: number;
	maxReq?: number;
	useRouteKey?: boolean;
	tiers?: Partial<Record<TokenTier, RateLimitTier>>;
	roles?: Partial<Record<UserRole, RateLimitTier>>;
}

const defaultTiers: Required<NonNullable<RateLimitOptions["tiers"]>> = {
	basic: { maxReq: 100, windowMs: 60 * 1000 },
	pro: { maxReq: 1000, windowMs: 60 * 1000 },
	unlimited: { maxReq: Number.POSITIVE_INFINITY, windowMs: 60 * 1000 },
};

const defaultRoles: Required<NonNullable<RateLimitOptions["roles"]>> = {
	guest: { maxReq: 60, windowMs: 60 * 60 * 1000 },
	user: { maxReq: 100, windowMs: 60 * 1000 },
	moderator: { maxReq: 1000, windowMs: 60 * 1000 },
	admin: { maxReq: Number.POSITIVE_INFINITY, windowMs: 60 * 1000 },
};

const defaultOptions: Required<RateLimitOptions> = {
	windowMs: 60 * 1000,
	maxReq: 60,
	tiers: defaultTiers,
	roles: defaultRoles,
	useRouteKey: false,
};

export const createRateLimit = (options: Partial<RateLimitOptions> = {}): onRequestHookHandler => {
	const finalOptions: Required<RateLimitOptions> = {
		...defaultOptions,
		tiers: { ...defaultOptions.tiers, ...options.tiers },
		roles: { ...defaultOptions.roles, ...options.roles },
		...options,
		useRouteKey: options.useRouteKey ?? defaultOptions.useRouteKey,
	};

	return async function rateLimit(req: FastifyRequest, res: FastifyReply, done: HookHandlerDoneFunction) {
		try {
			let rateLimit: RateLimitTier;

			if (req.apiToken) {
				const tier = req.apiToken.tier as TokenTier;
				const tierLimit = finalOptions.tiers[tier];
				rateLimit = tierLimit ?? { maxReq: finalOptions.maxReq, windowMs: finalOptions.windowMs };
			} else if (req.user) {
				const { role, tier } = req.user as { role: UserRole; tier?: TokenTier };
				const tierLimit = tier && finalOptions.tiers[tier];
				const roleLimit = finalOptions.roles[role];

				if (tierLimit) rateLimit = tierLimit;
				else if (roleLimit) rateLimit = roleLimit;
				else rateLimit = { maxReq: finalOptions.maxReq, windowMs: finalOptions.windowMs };
			} else {
				const guestLimit = finalOptions.roles.guest;
				rateLimit = guestLimit ?? { maxReq: finalOptions.maxReq, windowMs: finalOptions.windowMs };
			}

			if (rateLimit.maxReq === Number.POSITIVE_INFINITY) return done();

			const key = (() => {
				const useRouteKey = finalOptions?.useRouteKey === true;
				const route = req.routeOptions.url?.replace("/", "") ?? "unknown";

				if (req.apiToken) {
					const tokenId = req.apiToken.id;
					return `ratelimit:api:${tokenId}${useRouteKey ? `:${route}` : ""}`;
				}

				if (req.user) {
					if ((req.user as User).role === "guest") {
						const fingerprint = generateFingerprint(req);
						return `ratelimit:guest:${fingerprint}${useRouteKey ? `:${route}` : ""}`;
					}
					const userId = (req.user as { id: number }).id;
					return `ratelimit:user:${userId}${useRouteKey ? `:${route}` : ""}`;
				}

				const fingerprint = generateFingerprint(req);
				return `ratelimit:unauth:${fingerprint}${useRouteKey ? `:${route}` : ""}`;
			})();

			const current = await redis.get(key);
			const count = current ? Number.parseInt(current, 10) : 0;

			if (count >= rateLimit.maxReq) {
				res.status(429).send({
					statusCode: 429,
					error: "Too Many Requests",
					message: i18n.t("errors.tooManyRequests", req.language),
				});
				return done();
			}

			if (count === 0) {
				await redis.setex(key, Math.ceil(rateLimit.windowMs / 1000), "1");
			} else {
				await redis.incr(key);
			}

			res.header("X-RateLimit-Limit", rateLimit.maxReq.toString());
			res.header("X-RateLimit-Remaining", (rateLimit.maxReq - count - 1).toString());

			done();
		} catch (err) {
			req.log.error("Rate limit error:", err);
			done();
		}
	};
};

export const globalRateLimit = createRateLimit();
