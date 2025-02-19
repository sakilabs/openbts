import { PermissionManagerInstance } from "../utils/permissions.js";

import type { FastifyRequest, FastifyReply } from "fastify";
import type { RoutePermissions } from "../interfaces/fastify.interface.js";

export function APITokenMiddleware(req: FastifyRequest, res: FastifyReply) {
	const permissions = (req.routeOptions as RoutePermissions).permissions;
	if (!permissions) return;

	if (!req.apiToken) {
		return res.status(403).send({
			success: false,
			message: "Missing API token",
		});
	}

	const missingPermissions = PermissionManagerInstance.getMissingPermissions(permissions, req.apiToken.permissions);
	if (missingPermissions.length > 0) {
		return res.status(403).send({
			success: false,
			message: `Insufficient permissions. Missing: ${missingPermissions.join(", ")}`,
			missingPermissions,
		});
	}
}
