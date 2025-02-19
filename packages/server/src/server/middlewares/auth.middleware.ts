import { i18n } from "../i18n/index.js";

import type { FastifyReply, FastifyRequest } from "fastify";
import type { Route } from "../interfaces/routes.interface.js";
import type { UserRole } from "../hooks/ratelimit.hook.js";

export async function AuthMiddleware(req: FastifyRequest, res: FastifyReply) {
	const route = req.routeOptions as Route;

	if (!route?.allowLoggedIn) {
		if (req.user && (req.user as { role: UserRole }).role !== "guest") {
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

	try {
		await req.jwtVerify();
	} catch (err) {
		const error = err as { code: string };
		res.status(403).send({
			statusCode: 403,
			error: "Forbidden",
			message: error.code,
		});
	}
}
