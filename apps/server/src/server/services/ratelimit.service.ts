import type { Redis } from "ioredis";
import type { FastifyRequest } from "fastify";
import { generateFingerprint } from "../utils/fingerprint.js";
import type { TokenTier, UserRole } from "../interfaces/auth.interface.js";

export type RateLimitTier = {
	max: number;
	window: number;
};

export interface RateLimitOptions {
	window?: number;
	max?: number;
	useRouteKey?: boolean;
	tiers?: Partial<Record<TokenTier, RateLimitTier>>;
	roles?: Partial<Record<UserRole, RateLimitTier>>;
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	limit: number;
	reset: number;
	retryAfter?: number;
}

export class RateLimitService {
	private redis: Redis;
	private prefix = "ratelimit:";

	private defaultTiers: Required<NonNullable<RateLimitOptions["tiers"]>> = {
		basic: { max: 100, window: 60 },
		pro: { max: 1000, window: 60 },
		unlimited: { max: Number.POSITIVE_INFINITY, window: 60 },
	};

	private defaultRoles: Required<NonNullable<RateLimitOptions["roles"]>> = {
		guest: { max: 60, window: 60 },
		user: { max: 100, window: 60 },
		moderator: { max: 1000, window: 60 },
		admin: { max: Number.POSITIVE_INFINITY, window: 60 },
	};

	private defaultOptions: Required<RateLimitOptions> = {
		window: 60,
		max: 60,
		tiers: this.defaultTiers,
		roles: this.defaultRoles,
		useRouteKey: false,
	};

	private options: Required<RateLimitOptions>;

	/**
	 * Create a new RateLimitService instance
	 * @param redisClient Redis client instance
	 * @param options Rate limit configuration options
	 */
	constructor(redisClient: Redis, options: Partial<RateLimitOptions> = {}) {
		this.redis = redisClient;

		this.options = {
			...this.defaultOptions,
			tiers: { ...this.defaultOptions.tiers, ...options.tiers },
			roles: { ...this.defaultOptions.roles, ...options.roles },
			...options,
			useRouteKey: options.useRouteKey ?? this.defaultOptions.useRouteKey,
		};
	}

	/**
	 * Generate a rate limit key based on the request
	 * @param req FastifyRequest object
	 * @returns Rate limit key or null if fingerprint generation fails
	 */
	generateKey(req: FastifyRequest): string | null {
		const useRouteKey = this.options.useRouteKey === true;
		const route = req.routeOptions.url?.replace("/", "") ?? "unknown";

		if (req.apiToken) {
			const tokenId = req.apiToken.id;
			return `${this.prefix}api:${tokenId}${useRouteKey ? `:${route}` : ""}`;
		}

		if (req.userSession) {
			if (!req.userSession.user?.isAnonymous) return `${this.prefix}user:${req.userSession.user.id}${useRouteKey ? `:${route}` : ""}`;

			const fingerprint = generateFingerprint(req);
			if (!fingerprint) return null;
			return `${this.prefix}guest:${fingerprint}${useRouteKey ? `:${route}` : ""}`;
		}

		const fingerprint = generateFingerprint(req);
		if (!fingerprint) return null;
		return `${this.prefix}unauth:${fingerprint}${useRouteKey ? `:${route}` : ""}`;
	}

	/**
	 * Get API key rate limit settings
	 * @param apiKeyId API key ID
	 * @returns Rate limit configuration or null if not found
	 */
	private async getApiKeyRateLimit(req: FastifyRequest): Promise<RateLimitTier | null> {
		try {
			const result = req.apiToken;
			if (!result) return null;

			if (result.rateLimitTimeWindow && result.rateLimitMax) {
				return {
					window: result.rateLimitTimeWindow,
					max: result.rateLimitMax,
				};
			}

			return null;
		} catch (error) {
			console.error("Error fetching API key rate limit:", error);
			return null;
		}
	}

	/**
	 * Determine the appropriate rate limit tier for a request
	 * @param req FastifyRequest object
	 * @returns Rate limit configuration for the request
	 */
	async getRateLimitTier(req: FastifyRequest): Promise<RateLimitTier> {
		if (req.apiToken) {
			const apiKeyRateLimit = await this.getApiKeyRateLimit(req);
			if (apiKeyRateLimit) return apiKeyRateLimit;
		}

		if (req.userSession?.user) {
			if (req.userSession.user.isAnonymous) {
				const guestLimit = this.options.roles.guest;
				return guestLimit ?? { max: this.options.max, window: this.options.window };
			}

			if (req.userSession.user.role) {
				const role = req.userSession.user.role as UserRole;
				const roleLimit = this.options.roles[role];
				return roleLimit ?? this.options.roles.user ?? { max: this.options.max, window: this.options.window };
			}

			return this.options.roles.user ?? { max: this.options.max, window: this.options.window };
		}

		const guestLimit = this.options.roles.guest;
		return guestLimit ?? { max: this.options.max, window: this.options.window };
	}

	/**
	 * Check if a request is within rate limits
	 * @param key Rate limit key
	 * @param rateLimit Rate limit configuration
	 * @returns Rate limit check result
	 */
	async check(key: string, rateLimit: RateLimitTier): Promise<RateLimitResult> {
		if (rateLimit.max === Number.POSITIVE_INFINITY) {
			return {
				allowed: true,
				remaining: Number.POSITIVE_INFINITY,
				limit: Number.POSITIVE_INFINITY,
				reset: Math.floor(Date.now() / 1000) + rateLimit.window,
			};
		}

		const current = await this.redis.get(key);
		const count = current ? Number.parseInt(current, 10) : 0;

		if (count >= rateLimit.max) {
			const ttl = await this.redis.ttl(key);
			const retryAfter = ttl > 0 ? ttl : rateLimit.window;
			const resetTime = Math.floor(Date.now() / 1000) + retryAfter;

			return {
				allowed: false,
				remaining: 0,
				limit: rateLimit.max,
				reset: resetTime,
				retryAfter,
			};
		}

		if (count === 0) await this.redis.setex(key, rateLimit.window, "1");
		else await this.redis.incr(key);

		const ttl = await this.redis.ttl(key);
		const resetTime = Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : rateLimit.window);

		return {
			allowed: true,
			remaining: rateLimit.max - count - 1,
			limit: rateLimit.max,
			reset: resetTime,
		};
	}

	/**
	 * Process rate limiting for a request
	 * @param req FastifyRequest object
	 * @returns Rate limit check result or null if rate limiting should be skipped
	 */
	async processRequest(req: FastifyRequest): Promise<RateLimitResult | null> {
		try {
			const rateLimit = await this.getRateLimitTier(req);

			if (rateLimit.max === Number.POSITIVE_INFINITY) return null;

			const key = this.generateKey(req);
			if (!key) return null;

			return await this.check(key, rateLimit);
		} catch (err) {
			console.error("Rate limit error:", err);
			return null;
		}
	}

	/**
	 * Update service options
	 * @param options New rate limit options
	 */
	updateOptions(options: Partial<RateLimitOptions>): void {
		this.options = {
			...this.options,
			tiers: { ...this.options.tiers, ...options.tiers },
			roles: { ...this.options.roles, ...options.roles },
			...options,
			useRouteKey: options.useRouteKey ?? this.options.useRouteKey,
		};
	}
}
