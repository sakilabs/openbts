import { getRuntimeSettings } from "../services/settings.service.js";
import { ErrorResponse } from "../errors.js";
import { auth, getCurrentUser } from "../plugins/betterauth.plugin.js";

import type { FastifyRequest, FastifyReply } from "fastify";
import type { Route } from "../interfaces/routes.interface.js";

const permissionSchema = {
	cells: ["read", "create", "update", "delete"],
	stations: ["read", "create", "update", "delete"],
	operators: ["read", "create", "update", "delete"],
	regions: ["read", "create", "update", "delete"],
	locations: ["read", "create", "update", "delete"],
	submissions: ["read", "create", "update", "delete"],
	comments: ["read", "create", "delete"],
	bands: ["read", "create", "update", "delete"],
	users: ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password"],
	session: ["list", "delete", "revoke"],
} as const;

type PermissionSchema = typeof permissionSchema;
type BetterAuthPermissions = Partial<{
	-readonly [K in keyof PermissionSchema]: PermissionSchema[K][number][];
}>;

export async function permissionsMiddleware(req: FastifyRequest, _: FastifyReply) {
	const route = req.routeOptions as Route;
	if (!route?.config?.permissions) return;
	if (req.apiToken) return;
	const settings = getRuntimeSettings();
	const requireAuth = settings.enforceAuthForAllRoutes || !route?.config?.allowGuestAccess;
	if (requireAuth) {
		const user = await getCurrentUser(req);
		console.log(user, req.apiToken);
		if (!user && !req.apiToken) throw new ErrorResponse("UNAUTHORIZED");
		return;
	}

	const permissions: BetterAuthPermissions = {};

	for (const perm of route.config.permissions as string[]) {
		const [action, resource] = perm.split(":");

		if (action && resource && resource in permissionSchema) {
			const typedResource = resource as keyof PermissionSchema;
			const validActions = permissionSchema[typedResource];

			if ((validActions as readonly string[]).includes(action)) {
				if (!permissions[typedResource]) {
					permissions[typedResource] = [];
				}
				(permissions[typedResource] as string[]).push(action);
			}
		}
	}

	const userId = req.userSession?.user.id || null;
	if (!userId) throw new ErrorResponse("UNAUTHORIZED");

	const result = await auth.api.userHasPermission({
		body: {
			userId: userId,
			permissions,
		},
	});

	if (!result.success) throw new ErrorResponse("INSUFFICIENT_PERMISSIONS");
}
