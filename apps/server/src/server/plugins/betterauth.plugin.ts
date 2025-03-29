import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, anonymous, apiKey, multiSession, username } from "better-auth/plugins";
import { hash, verify } from "@node-rs/argon2";

import { db } from "../database/psql.js";
import { redis } from "../database/redis.js";
import { ARGON2_OPTIONS, PUBLIC_ROUTES } from "../constants.js";
import { accessControl, adminRole, modRole, userRole } from "../utils/permissions.js";

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { UserRole } from "../interfaces/auth.interface.js";

declare module "fastify" {
	interface FastifyInstance {
		auth: { handler: (request: Request) => Promise<Response> } | ((request: Request) => Promise<Response>);
	}
}

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
	disabledPaths: PUBLIC_ROUTES,
});

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

export const registerBetterAuth = (fastify: FastifyInstance, options: { handler: (request: Request) => Promise<Response> }) => {
	// @ts-ignore: The type definitions for fastify.decorate are more restrictive than our usage
	fastify.decorate("auth", options);
	fastify.register((fastify) => {
		const authHandler = toNodeHandler(options);

		fastify.addContentTypeParser("application/json", (_req, _payload, done) => {
			done(null, null);
		});

		fastify.all("/api/v1/auth/*", async (req, res) => {
			res.raw.setHeaders(mapHeaders(res.getHeaders()));
			await authHandler(req.raw, res.raw);
		});
	});
};
