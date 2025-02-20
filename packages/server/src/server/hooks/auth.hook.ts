import { eq } from "drizzle-orm/pg-core/expressions";

import { i18n } from "../i18n/index.js";
import { db } from "../database/index.js";
import { apiTokens } from "@openbts/drizzle";
import { API_TOKEN_PREFIX, BEARER_PREFIX, PUBLIC_ROUTES, ROLE_SCOPES } from "../constants.js";

import type { User } from "../interfaces/auth.interface.js";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { Route } from "../interfaces/routes.interface.js";

export async function authHook(req: FastifyRequest, res: FastifyReply) {
	const route = req.routeOptions as Route;
	const url = (route as { url: string }).url;

	if (PUBLIC_ROUTES.some((publicRoute) => url.startsWith(publicRoute))) return;

	if (route?.allowLoggedIn === false) {
		if (req.apiToken || (req.user && (req.user as User).type !== "guest")) {
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

			if (token.is_revoked || (token.expires_at && token?.expires_at < new Date())) {
				return res.status(403).send({
					statusCode: 403,
					error: "Forbidden",
					message: i18n.t("errors.invalidApiToken", req.language),
				});
			}

			await db.update(apiTokens).set({ last_used_at: new Date() }).where(eq(apiTokens.id, token.id));

			req.apiToken = {
				id: token.id,
				tier: token.tier,
				scope: token.scope,
			};
			return;
		} catch (err) {
			return res.status(403).send({
				statusCode: 403,
				error: "Forbidden",
				message: i18n.t("errors.invalidApiToken", req.language),
			});
		}
	}

	if (auth.startsWith(BEARER_PREFIX)) {
		try {
			await req.jwtVerify();
			const decodedToken = req.user as User;

			if (decodedToken?.type === "user" && decodedToken.user_id) {
				const user = await db.query.users.findFirst({
					where: (fields, { eq }) => eq(fields.id, Number(decodedToken.user_id)),
				});

				if (!user) {
					return res.status(403).send({
						statusCode: 403,
						error: "Forbidden",
						message: i18n.t("errors.userNotFound", req.language),
					});
				}

				req.user = {
					...decodedToken,
					role: user.role,
					scope: ROLE_SCOPES[user.role],
				};
			} else if (decodedToken?.type === "guest") {
				req.user = {
					...decodedToken,
					scope: ROLE_SCOPES.guest,
				};
			}

			return;
		} catch (err) {
			const error = err as { code: string };
			return res.status(403).send({
				statusCode: 403,
				error: "Forbidden",
				message: error.code,
			});
		}
	}

	return res.status(403).send({
		statusCode: 403,
		error: "Forbidden",
		message: i18n.t("errors.invalidAuthorizationFormat", req.language),
	});
}
