import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { redis } from "../../../../database/redis.js";
import { RedisSessionService } from "../../../../services/redis.session.js";
import { JWTService } from "../../../../services/jwt.service.js";
import { REDIS_REVOKED_TOKEN_PREFIX } from "../../../../constants.js";

import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "server/interfaces/fastify.interface.js";

type ReqBody = {
	Body: {
		refreshToken: string;
	};
};
type ResponseData = {
	accessToken: string;
	refreshToken: string;
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
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
		const decoded = await jwtService.verifyRefreshToken(refreshToken);

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

		const refreshedAccessToken = await jwtService.signAccessToken({
			type: "user",
			jti: randomUUID(),
			sub: user.id.toString(),
		});

		const sessionService = new RedisSessionService(redis);
		await sessionService.updateSessionAccessToken(user.id, refreshToken, refreshedAccessToken);

		return res.send({
			success: true,
			data: {
				accessToken: refreshedAccessToken,
				refreshToken,
			},
		});
	} catch (err) {
		return res.status(401).send({
			success: false,
			error: "Unauthorized",
			message: i18n.t("errors.invalidToken", req.language),
		});
	}
}

const refreshTokenRoute: Route<ReqBody, ResponseData> = {
	method: "POST",
	url: "/auth/refreshSession",
	config: { allowLoggedIn: false },
	handler,
};

export default refreshTokenRoute;
