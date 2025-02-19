import { createVerifier } from "fast-jwt";

import { i18n } from "../../../../i18n/index.js";
import { redis } from "../../../../database/redis.js";
import { createRateLimit } from "../../../../hooks/ratelimit.hook.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const RATE_LIMIT_SECONDS = 24 * 60 * 60; // 24 hours

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
			},
			required: ["success", "data"],
		},
	},
};

async function handler(req: FastifyRequest, res: ReplyPayload<JSONBody<{ token: string }>>) {
	try {
		const ip = req.ip;
		const key = `guest-token:${ip}`;

		const existingToken = await redis.get(key);
		const verifySync = createVerifier({ key: async () => process.env.JWT_SECRET });
		if (existingToken) {
			try {
				await verifySync(existingToken);
				return res.send({
					success: true,
					data: { token: existingToken },
				});
			} catch (error) {
				await redis.del(key);
			}
		}

		const token = await res.jwtSign(
			{
				role: "guest",
			},
			{
				expiresIn: RATE_LIMIT_SECONDS,
			},
		);

		await redis.setex(key, RATE_LIMIT_SECONDS, token);

		return res.send({
			success: true,
			data: { token },
		});
	} catch (error) {
		req.log.error(error, "Failed to generate guest token");
		return res.status(500).send({
			statusCode: 500,
			error: "Internal Server Error",
			message: i18n.t("errors.internalServerError", req.language),
		});
	}
}

const getGuestToken: Route = {
	url: "/guest-token",
	method: "GET",
	schema: schemaRoute,
	handler,
	allowLoggedIn: false,
	onRequest: [
		createRateLimit({
			maxReq: 1,
			windowMs: RATE_LIMIT_SECONDS * 1000,
		}),
	],
};

export default getGuestToken;
