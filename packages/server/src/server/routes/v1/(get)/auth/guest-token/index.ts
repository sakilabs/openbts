import { randomUUID } from "node:crypto";

import { i18n } from "../../../../../i18n/index.js";
import { redis } from "../../../../../database/redis.js";
import { createRateLimit } from "../../../../../hooks/ratelimit.hook.js";
import { generateFingerprint } from "../../../../../utils/fingerprint.js";
import { JWTService } from "../../../../../services/jwt.service.js";
import { GUEST_TOKEN_EXPIRATION } from "../../../../../constants.js";

import type { FastifyRequest, RouteGenericInterface } from "fastify";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const schemaRoute = {
	response: {
		200: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				data: {
					type: "object",
					properties: {
						token: { type: "string" },
					},
					required: ["token"],
				},
				error: { type: ["string"] },
				message: { type: ["string"] },
			},
			required: ["success"],
		},
	},
};

async function handler(req: FastifyRequest, res: ReplyPayload<JSONBody<{ accessToken: string }>>) {
	try {
		const fingerprint = generateFingerprint(req);
		if (!fingerprint) {
			return res.status(400).send({
				success: false,
				error: "Bad Request",
				message: i18n.t("errors.notGenuineRequest", req.language),
			});
		}

		const key = `guest-token:${fingerprint}`;

		const existingToken = await redis.get(key);
		const jwtService = JWTService.getInstance();

		if (existingToken) {
			try {
				await jwtService.verifyAccessToken(existingToken);
				return res.send({
					success: true,
					data: { accessToken: existingToken },
				});
			} catch (error) {
				await redis.del(key);
			}
		}

		const token = await jwtService.signAccessToken({
			type: "guest",
			jti: randomUUID(),
		});

		await redis.setex(key, GUEST_TOKEN_EXPIRATION, token);

		return res.send({
			success: true,
			data: { accessToken: token },
		});
	} catch (error) {
		const fingerprint = generateFingerprint(req);
		if (fingerprint !== null) {
			redis.del(`ratelimit:guest:${fingerprint}:guest-token`);
		}
		return res.status(500).send({
			success: false,
			error: "Internal Server Error",
			message: (error as Error).message,
		});
	}
}

const getGuestToken: Route<RouteGenericInterface, { accessToken: string }> = {
	url: "/auth/guest-token",
	method: "GET",
	schema: schemaRoute,
	handler,
	config: {
		allowLoggedIn: false,
	},
	onRequest: [
		createRateLimit({
			maxReq: 1,
			windowMs: GUEST_TOKEN_EXPIRATION * 1000,
			useRouteKey: true,
		}),
	],
};

export default getGuestToken;
