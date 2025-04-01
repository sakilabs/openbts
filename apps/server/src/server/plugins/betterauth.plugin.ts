import { fromNodeHeaders } from "better-auth/node";
import { betterAuth, type AuthContext, type MiddlewareContext, type MiddlewareOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, anonymous, apiKey, multiSession, username } from "better-auth/plugins";
import { createAuthMiddleware, getSessionFromCtx, APIError } from "better-auth/api";
import { hash, verify } from "@node-rs/argon2";

import { db } from "../database/psql.js";
import { redis } from "../database/redis.js";
import { API_KEYS_LIMIT, ARGON2_OPTIONS, PUBLIC_ROUTES } from "../constants.js";
import { accessControl, adminRole, modRole, userRole } from "../utils/permissions.js";

import type { FastifyRequest } from "fastify";
import type { UserRole } from "../interfaces/auth.interface.js";

export function mapHeaders(headers: { [s: string]: unknown } | ArrayLike<unknown>) {
	const entries = Object.entries(headers);
	const map = new Map();
	for (const [headerKey, headerValue] of entries) {
		if (headerValue != null) map.set(headerKey, headerValue);
	}
	return map;
}

export const auth = betterAuth({
	advanced: {
		cookiePrefix: "openbts",
	},
	basePath: "/api/v1/auth",
	database: drizzleAdapter(db, {
		provider: "pg",
		usePlural: true,
	}),
	emailAndPassword: {
		enabled: true,
		password: {
			hash: async (password) => {
				const hashedPwd = await hash(password, ARGON2_OPTIONS);

				return hashedPwd;
			},
			verify: async ({ hash, password }) => {
				const isValid = await verify(password, hash);
				return isValid;
			},
		},
	},
	hooks: {
		before: createAuthMiddleware(beforeAuthHook.bind(this)),
	},
	plugins: [
		admin({
			ac: accessControl,
			adminRoles: ["admin"],
			defaultRole: "user" as UserRole,
			roles: {
				admin: adminRole,
				// moderator: modRole,
				user: userRole,
			},
		}),
		anonymous(),
		apiKey({
			apiKeyHeaders: ["authorization"],
			defaultPrefix: "openbts_",
			enableMetadata: true,
			permissions: {
				defaultPermissions: async (userId, ctx) => {
					return {
						cells: ["read"],
						stations: ["read"],
						operators: ["read"],
						locations: ["read"],
						bands: ["read"],
					};
				},
			},
		}),
		multiSession(),
		username({
			minUsernameLength: 3,
			maxUsernameLength: 30,
			// usernameValidator: (username) => {
			// 	if (["admin", "administrator", "mod", "moderator"].includes(username)) return false;
			// 	return true;
			// },
		}),
	],
	rateLimit: {
		enabled: false,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
	secondaryStorage: {
		get: async (key) => {
			const value = await redis.get(`auth:${key}`);
			return value ? value : null;
		},
		set: async (key, value, ttl) => {
			if (ttl) await redis.set(`auth:${key}`, value, "EX", ttl);
			else await redis.set(`auth:${key}`, value);
		},
		delete: async (key) => {
			await redis.del(`auth:${key}`);
		},
	},
	deleteUser: {
		enabled: true,
	},
	// disabledPaths: PUBLIC_ROUTES,
});

async function beforeAuthHook(
	ctx: MiddlewareContext<
		MiddlewareOptions,
		AuthContext & {
			returned?: unknown;
			responseHeaders?: Headers;
		}
	>,
) {
	if (ctx.path.startsWith("/api-key/create")) {
		const session = await getSessionFromCtx(ctx);

		if (!session) {
			throw new APIError("UNAUTHORIZED", {
				message: "Unauthorized access to this endpoint.",
			});
		}

		const keys = await db.query.apiKeys.findMany({
			where: (apiKeys, { eq }) => eq(apiKeys.userId, Number(session.user.id)),
		});

		if (keys.length >= API_KEYS_LIMIT && session.user.role !== "admin") {
			throw new APIError("TOO_MANY_REQUESTS", {
				message: "You have reached the maximum number of API keys. Please delete an existing key before creating a new one.",
			});
		}
	}

	const userEndpoints = [
		"/update-user",
		"/change-password",
		"/set-password",
		"/change-email",
		"/link-social",
		"/unlink-account",
		"/send-verification-email",
	];

	if (userEndpoints.some((endpoint) => ctx.path.startsWith(endpoint))) {
		const session = await getSessionFromCtx(ctx);

		if (!session) {
			throw new APIError("UNAUTHORIZED", {
				message: "Unauthorized access to this endpoint.",
			});
		}

		const isAnonymous = session.user.isAnonymous;

		if (isAnonymous) {
			throw new APIError("UNAUTHORIZED", {
				message: "Anonymous users can't modify the profile in any way.",
			});
		}
	}
}

export async function getCurrentUser(req: FastifyRequest) {
	const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

	return session;
}

export async function verifyApiKey(apiKey: string, requiredPermissions?: Record<string, string[]>) {
	const result = await auth.api.verifyApiKey({
		body: {
			key: apiKey,
			permissions: requiredPermissions,
		},
	});

	return result;
}
