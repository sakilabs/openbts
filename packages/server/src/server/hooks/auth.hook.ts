import { i18n } from "../i18n/index.js";
import { db } from "../database/index.js";
import { redis } from "../database/redis.js";
import { API_TOKEN_PREFIX, BEARER_PREFIX, PUBLIC_ROUTES } from "../constants.js";
import { JWTService } from "../services/jwt.service.js";

import type { FastifyReply, FastifyRequest } from "fastify";
import type { Route } from "../interfaces/routes.interface.js";
import type { SessionPayload } from "../interfaces/auth.interface.js";

const REDIS_REVOKED_TOKEN_PREFIX = "revoked_token:";

export async function authHook(req: FastifyRequest, res: FastifyReply) {
	const route = req.routeOptions as Route;
	const url = (route as { url: string }).url;

	if (PUBLIC_ROUTES.some((publicRoute) => url.startsWith(publicRoute))) return;

	if (route?.config?.allowLoggedIn === false) {
		if (req.apiToken || (req.userSession && req.userSession.type !== "guest")) {
			return res.status(403).send({
				statusCode: 403,
				error: "Forbidden",
				message: i18n.t("errors.alreadyLoggedIn", req.language),
			});
		}
		return;
	}

	const { headers } = req;
	if (!headers.authorization) {
		return res.status(403).send({
			statusCode: 403,
			error: "Forbidden",
			message: i18n.t("errors.invalidCredentials", req.language),
		});
	}

	const auth = headers.authorization;

	if (auth.startsWith(API_TOKEN_PREFIX)) {
		const apiToken = auth.slice(API_TOKEN_PREFIX.length);
		try {
			const token = await db.query.apiTokens.findFirst({
				where: (fields, { eq }) => eq(fields.token, apiToken),
			});

			if (!token) {
				return res.status(403).send({
					statusCode: 403,
					error: "Forbidden",
					message: i18n.t("errors.invalidApiToken", req.language),
				});
			}

			req.apiToken = token;
			return;
		} catch (error) {
			return res.status(403).send({
				statusCode: 403,
				error: "Forbidden",
				message: i18n.t("errors.invalidApiToken", req.language),
			});
		}
	}

	if (!auth.startsWith(BEARER_PREFIX)) {
		return res.status(403).send({
			statusCode: 403,
			error: "Forbidden",
			message: i18n.t("errors.invalidCredentials", req.language),
		});
	}

	try {
		const token = auth.slice(BEARER_PREFIX.length);
		const jwtService = JWTService.getInstance();
		const decodedJWT = (await jwtService.verifyAccessToken(token)) as SessionPayload;
		req.userSession = decodedJWT;

		if (decodedJWT.jti) {
			const isRevoked = await redis.get(`${REDIS_REVOKED_TOKEN_PREFIX}${decodedJWT.jti}`);
			if (isRevoked) {
				return res.status(401).send({
					statusCode: 401,
					error: "Unauthorized",
					message: i18n.t("errors.tokenRevoked", req.language),
				});
			}
		}

		return;
	} catch (err) {
		return res.status(401).send({
			statusCode: 401,
			error: "Unauthorized",
			message: i18n.t("errors.invalidCredentials", req.language),
		});
	}
}
