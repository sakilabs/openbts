import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "../../../../database/index.js";
import { i18n } from "../../../../i18n/index.js";
import { redis } from "../../../../database/redis.js";
import { RedisSessionService } from "../../../../services/redis.session.js";
import { JWTService } from "../../../../services/jwt.service.js";

import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { FastifyRequest } from "fastify";
import type { TokenPayload } from "../../../../interfaces/auth.interface.js";
import type { ReplyPayload } from "server/interfaces/fastify.interface.js";

interface RefreshBody {
	refreshToken: string;
}

const REDIS_REVOKED_TOKEN_PREFIX = "revoked_token:";

export const refresh: Route = {
	method: "POST",
	url: "/auth/refresh",
	config: { allowLoggedIn: false },
	handler: async (req: FastifyRequest<{ Body: RefreshBody }>, res: ReplyPayload<JSONBody<{ accessToken: string }>>) => {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			return res.status(400).send({
				success: false,
				error: "Bad Request",
				message: i18n.t("errors.missingFields", req.language),
			});
		}

		try {
			const jwtService = JWTService.getInstance();
			const decoded = (await jwtService.verifyRefreshToken(refreshToken)) as TokenPayload;

			if (decoded.type !== "refresh") {
				return res.status(401).send({
					success: false,
					error: "Invalid token type",
					message: i18n.t("errors.invalidToken", req.language),
				});
			}

			if (decoded.jti) {
				const isRevoked = await redis.get(`${REDIS_REVOKED_TOKEN_PREFIX}${decoded.jti}`);
				if (isRevoked) {
					return res.status(401).send({
						success: false,
						error: "Unauthorized",
						message: i18n.t("errors.tokenRevoked", req.language),
					});
				}
			}

			if (!decoded.sub) {
				return res.status(401).send({
					success: false,
					error: "Unauthorized",
					message: i18n.t("errors.invalidToken", req.language),
				});
			}

			const user = await db.query.users.findFirst({
				where: (fields) => eq(fields.id, Number(decoded.sub)),
			});

			if (!user) {
				return res.status(401).send({
					success: false,
					error: "Unauthorized",
					message: i18n.t("errors.invalidToken", req.language),
				});
			}

			const accessToken = await jwtService.signAccessToken({
				type: "user",
				jti: randomUUID(),
				sub: user.id.toString(),
			});

			const sessionService = new RedisSessionService(redis);
			await sessionService.updateSessionAccessToken(user.id, accessToken);

			return res.send({
				success: true,
				data: {
					accessToken,
				},
			});
		} catch (err) {
			return res.status(401).send({
				success: false,
				error: "Unauthorized",
				message: i18n.t("errors.invalidToken", req.language),
			});
		}
	},
};
