import { PUBLIC_ROUTES } from "../constants.js";
import { getCurrentUser, verifyApiKey } from "../plugins/betterauth.plugin.js";
import { ErrorResponse } from "../errors.js";
import { getRuntimeSettings } from "../services/settings.service.js";

import type { FastifyReply, FastifyRequest } from "fastify";
import type { Route } from "../interfaces/routes.interface.js";
import type { ApiToken } from "../interfaces/fastify.interface.js";

export async function authHook(req: FastifyRequest, _: FastifyReply) {
  const route = req.routeOptions as unknown as Route;
  const url = req.url;

  const settings = getRuntimeSettings();
  if (settings.disabledRoutes.some((p) => url?.startsWith(p))) throw new ErrorResponse("FORBIDDEN");
  const isPublicByStatic = PUBLIC_ROUTES.some((p) => url?.startsWith(p));
  const isPublicByRuntime = settings.allowedUnauthenticatedRoutes.some((p) => url?.startsWith(p));
  if (isPublicByRuntime) return;
  if (isPublicByStatic && !settings.enforceAuthForAllRoutes) return;

  const { headers } = req;
  const authHeader = headers.authorization;
  if (!authHeader) {
    const user = await getCurrentUser(req);
    const allowGuest = route?.config?.allowGuestAccess && !settings.enforceAuthForAllRoutes;
    if (!user && !allowGuest) throw new ErrorResponse("UNAUTHORIZED");

    req.userSession = user;
  }

  if (authHeader) {
    const apiKey = authHeader.split(" ")[1];
    if (!apiKey) throw new ErrorResponse("UNAUTHORIZED");

    let routePermissions: Record<string, string[]> | undefined;
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
    if (!valid || !key) throw new ErrorResponse("FORBIDDEN");

    req.apiToken = key as ApiToken;
  }
}
