import { ErrorResponse } from "../errors.js";
import { auth } from "../plugins/betterauth.plugin.js";

import type { FastifyRequest, FastifyReply } from "fastify";

interface BetterAuthPermission {
	cells?: ("read" | "create" | "update" | "delete")[];
	stations?: ("read" | "create" | "update" | "delete")[];
	operators?: ("read" | "create" | "update" | "delete")[];
	regions?: ("read" | "create" | "update" | "delete")[];
	locations?: ("read" | "create" | "update" | "delete")[];
	submissions?: ("read" | "create" | "update" | "delete")[];
	comments?: ("read" | "create" | "delete")[];
	bands?: ("read" | "create" | "update" | "delete")[];
	users?: ("create" | "list" | "set-role" | "ban" | "impersonate" | "delete" | "set-password")[];
	session?: ("list" | "delete" | "revoke")[];
}

export async function permissionsMiddleware(req: FastifyRequest, res: FastifyReply) {
	const route = req.routeOptions;
	if (!route?.config?.permissions) return;
	if (req.apiToken) return;

	const permission: BetterAuthPermission = {};
	for (const perm of route.config.permissions) {
		const [action, resource] = perm.split(":");

		if (action && resource) {
			switch (resource) {
				case "cells":
				case "stations":
				case "operators":
				case "locations":
				case "bands":
				case "regions":
				case "submissions":
					if (["read", "create", "update", "delete"].includes(action)) {
						if (!permission[resource]) permission[resource] = [];

						permission[resource]?.push(action as "read" | "create" | "update" | "delete");
					}
					break;
				case "comments":
					if (["read", "create", "delete"].includes(action)) {
						if (!permission.comments) permission.comments = [];

						permission.comments.push(action as "read" | "create" | "delete");
					}
					break;
				case "users":
					if (["create", "list", "set-role", "ban", "impersonate", "delete", "set-password"].includes(action)) {
						if (!permission.users) permission.users = [];

						permission.users.push(action as "create" | "list" | "set-role" | "ban" | "impersonate" | "delete" | "set-password");
					}
					break;
				case "session":
					if (["list", "delete", "revoke"].includes(action)) {
						if (!permission.session) permission.session = [];

						permission.session.push(action as "list" | "delete" | "revoke");
					}
					break;
			}
		}
	}

	const userId = req.userSession?.user?.id || null;
	if (!userId) throw new ErrorResponse("UNAUTHORIZED");

	const result = await auth.api.userHasPermission({
		body: {
			userId,
			permission,
		},
	});

	if (!result.success) throw new ErrorResponse("INSUFFICIENT_PERMISSIONS");
}
