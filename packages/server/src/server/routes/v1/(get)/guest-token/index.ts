import { createVerifier } from "fast-jwt";
import { i18n } from "../../../../i18n/index.js";
import { redis } from "../../../../database/redis.js";
import { createRateLimit } from "../../../../hooks/ratelimit.hook.js";
import { generateFingerprint } from "../../../../utils/fingerprint.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const GUEST_TOKEN_EXPIRATION = 24 * 60 * 60; // 24 hours

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

async function handler(req: FastifyRequest, res: ReplyPayload<JSONBody<{ token: string }>>) {
	try {
		const fingerprint = generateFingerprint(req);
		const key = `guest-token:${fingerprint}`;

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
				type: "guest",
			},
			{
				expiresIn: GUEST_TOKEN_EXPIRATION,
			},
		);

		await redis.setex(key, GUEST_TOKEN_EXPIRATION, token);

		return res.send({
			success: true,
			data: { token },
		});
	} catch (error) {
		req.log.error(error, "Failed to generate guest token");
		redis.del(`ratelimit:guest:${generateFingerprint(req)}:guest-token`);
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
			windowMs: GUEST_TOKEN_EXPIRATION * 1000,
			useRouteKey: true,
		}),
	],
};

export default getGuestToken;
