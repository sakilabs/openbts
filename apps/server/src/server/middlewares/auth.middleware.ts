import { i18n } from "../i18n/index.js";
import { PUBLIC_ROUTES } from "../constants.js";
import { auth, getCurrentUser, verifyApiKey } from "../plugins/betterauth.plugin.js";

import type { FastifyReply, FastifyRequest } from "fastify";
import type { Route } from "../interfaces/routes.interface.js";

export async function authHook(req: FastifyRequest, res: FastifyReply) {
	const route = req.routeOptions as Route;
	const url = req.url;

	if (PUBLIC_ROUTES.some((publicRoute) => url?.startsWith(publicRoute))) return;

	if (route?.config?.allowLoggedIn === false) {
		const user = await getCurrentUser(req);
		if (user) {
			return res.status(403).send({
				statusCode: 403,
				error: "Forbidden",
				message: i18n.t("errors.alreadyLoggedIn", req.language),
			});
		}
		return;
	}

	const { headers } = req;
	const authHeader = headers.authorization;
	if (!authHeader) {
		const user = await getCurrentUser(req);
		if (!user) {
			return res.status(403).send({
				statusCode: 403,
				error: "Forbidden",
				message: i18n.t("errors.invalidCredentials", req.language),
			});
		}

		req.userSession = user;
		return;
	}

	if (authHeader) {
		const apiKey = authHeader;

		let routePermissions: Record<string, string[]> | undefined = undefined;
		if (route?.config?.permissions) {
			// Example: ["read:users", "write:posts"] => { users: ["read"], posts: ["write"] }
			routePermissions = {};
			for (const perm of route.config.permissions) {
				const [action, resource] = perm.split(":");
				if (action && resource) {
					if (!routePermissions[resource]) routePermissions[resource] = [];
					routePermissions[resource].push(action);
				}
			}
		}

		const { valid, key } = await verifyApiKey(apiKey, routePermissions);

		if (!valid || !key) {
			return res.status(403).send({
				statusCode: 403,
				error: "Forbidden",
				message: i18n.t("errors.invalidApiToken", req.language),
			});
		}

		req.apiToken = key;
		return;
	}

	return res.status(401).send({
		statusCode: 401,
		error: "Unauthorized",
		message: i18n.t("errors.invalidCredentials", req.language),
	});
}
