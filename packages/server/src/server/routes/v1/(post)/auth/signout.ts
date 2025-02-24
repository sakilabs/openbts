import { redis } from "../../../../database/redis.js";
import { i18n } from "../../../../i18n/index.js";
import { RedisSessionService } from "../../../../services/redis.session.js";
import { JWTService } from "../../../../services/jwt.service.js";

import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "server/interfaces/fastify.interface.js";

type ReqQuery = {
	Querystring: { signOutAll?: string };
};
type ResponseData = { message: string };

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const token = req.userSession;
	const accessToken = req.headers.authorization?.split(" ")[1];
	const signOutAll = req.query.signOutAll === "true";

	if (token?.type !== "user" || !accessToken) {
		return res.status(400).send({
			statusCode: 400,
			error: "Bad Request",
			message: i18n.t("errors.invalidSession", req.language),
		});
	}

	try {
		const sessionService = new RedisSessionService(redis);
		const jwtService = JWTService.getInstance();

		const decodedAccess = await jwtService.verifyAccessToken(accessToken);
		if (!decodedAccess.sub) {
			return res.status(401).send({
				statusCode: 401,
				error: "Unauthorized",
				message: i18n.t("errors.invalidToken", req.language),
			});
		}

		const userId = Number(decodedAccess.sub);
		const sessions = await sessionService.getUserSessions(userId);
		let currentSessionId: string | undefined;
		let currentRefreshToken: string | undefined;

		for (const sessionId of sessions) {
			const session = await sessionService.getSession(sessionId);
			if (session?.accessToken === accessToken) {
				currentSessionId = sessionId;
				currentRefreshToken = session.refreshToken;
				break;
			}
		}

		if (!currentRefreshToken) {
			return res.status(400).send({
				statusCode: 400,
				error: "Bad Request",
				message: i18n.t("errors.invalidSession", req.language),
			});
		}

		const decodedRefresh = await jwtService.verifyRefreshToken(currentRefreshToken);
		if (!decodedAccess.jti || !decodedRefresh.jti) {
			return res.status(401).send({
				statusCode: 401,
				error: "Unauthorized",
				message: i18n.t("errors.invalidToken", req.language),
			});
		}

		if (signOutAll) {
			for (const sessionId of sessions) {
				if (sessionId !== currentSessionId) {
					const session = await sessionService.getSession(sessionId);
					if (session?.accessToken && session?.refreshToken) {
						try {
							const otherAccessToken = await jwtService.verifyAccessToken(session.accessToken);
							const otherRefreshToken = await jwtService.verifyRefreshToken(session.refreshToken);

							if (otherAccessToken.jti && otherRefreshToken.jti)
								await sessionService.revokeSession(session.accessToken, otherAccessToken.jti, otherRefreshToken.jti);
							else await sessionService.revokeSessionById(userId, sessionId);
						} catch (error) {
							await sessionService.revokeSessionById(userId, sessionId);
						}
					} else await sessionService.revokeSessionById(userId, sessionId);
				}
			}
		}
		if (!signOutAll) await sessionService.revokeSession(accessToken, decodedAccess.jti, decodedRefresh.jti);

		return res.send({
			success: true,
			data: { message: signOutAll ? i18n.t("success.signedOutAllSessions", req.language) : i18n.t("success.signedOut", req.language) },
		});
	} catch (err) {
		return res.status(401).send({
			statusCode: 401,
			error: "Unauthorized",
			message: i18n.t("errors.invalidToken", req.language),
		});
	}
}

const signoutRoute: Route<ReqQuery, ResponseData> = {
	method: "POST",
	url: "/auth/signout",
	handler,
};

export default signoutRoute;
