import { PermissionManagerInstance } from "../utils/permissions.js";
import { i18n } from "../i18n/index.js";
import { ROLE_SCOPES } from "../constants.js";

import type { FastifyRequest, FastifyReply } from "fastify";
import type { SessionPayload } from "../interfaces/auth.interface.js";

export async function permissionsHook(req: FastifyRequest, res: FastifyReply) {
	const routePermissions = req.routeOptions.config?.permissions;
	if (!routePermissions) return;

	let scope = req.apiToken?.scope;
	const session = req.userSession as SessionPayload;

	if (!scope && session) {
		if (session.type === "user") {
			scope = session.user.scope || ROLE_SCOPES[session.user.role];
		} else if (session.type === "guest") {
			scope = ROLE_SCOPES.guest;
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
