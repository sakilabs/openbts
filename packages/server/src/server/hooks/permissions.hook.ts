import { PermissionManagerInstance } from "../utils/permissions.js";
import { i18n } from "../i18n/index.js";
import { ROLE_SCOPES } from "../constants.js";

import type { FastifyRequest, FastifyReply } from "fastify";
import type { RoutePermissions } from "../interfaces/fastify.interface.js";
import type { User } from "../interfaces/auth.interface.js";

export async function permissionsHook(req: FastifyRequest, res: FastifyReply) {
	const routePermissions = (req.routeOptions as RoutePermissions).permissions;
	if (!routePermissions) return;

	let scope = req.apiToken?.scope || (req.user as User)?.scope;

	if (!scope && req.user) {
		const user = req.user as User;
		if (user.type === "guest") {
			scope = ROLE_SCOPES.guest;
		} else if (user.role) {
			scope = ROLE_SCOPES[user.role];
		}
	}

	if (!scope) {
		return res.status(403).send({
			success: false,
			message: i18n.t("errors.invalidCredentials", req.language),
		});
	}

	const missingPermissions = PermissionManagerInstance.getMissingPermissions(routePermissions, scope);

	if (missingPermissions.length > 0) {
		return res.status(403).send({
			success: false,
			message: `Insufficient permissions. Missing: ${missingPermissions.join(", ")}`,
			missingPermissions,
		});
	}
}
