import { getSessionFromCtx, APIError, createAuthMiddleware } from "better-auth/api";
import { hash } from "@node-rs/argon2";
import * as schema from "@openbts/drizzle";

import { db } from "../../database/psql.js";
import { redis } from "../../database/redis.js";
import { API_KEYS_LIMIT, API_KEY_COOLDOWN_SECONDS, ARGON2_OPTIONS } from "../../constants.js";

import type { AuthContext, MiddlewareContext, MiddlewareOptions } from "better-auth";

type HookCtx = MiddlewareContext<MiddlewareOptions, AuthContext & { returned?: unknown; responseHeaders?: Headers }>;

export const PASSKEY_VERIFIED_TTL = 5 * 60; // 5 minutes
export const passkeyVerifiedKey = (userId: string) => `passkey-verified:${userId}`;

async function handleSetUserPassword(ctx: HookCtx) {
  const userId = ctx.body?.userId as string | undefined;
  const newPassword = ctx.body?.newPassword as string | undefined;
  if (!userId || !newPassword) throw new APIError("BAD_REQUEST", { message: "userId and newPassword are required" });

  const existingAccount = await db.query.accounts.findFirst({
    where: { AND: [{ userId }, { providerId: "credential" }] },
  });

  if (!existingAccount) {
    const hashedPassword = await hash(newPassword, ARGON2_OPTIONS);
    await db.insert(schema.accounts).values({
      userId,
      accountId: userId,
      providerId: "credential",
      password: hashedPassword,
    });

    return { context: ctx };
  }
}

async function handleApiKeyCreate(ctx: HookCtx) {
  const session = await getSessionFromCtx(ctx);
  if (!session) throw new APIError("UNAUTHORIZED", { message: "Unauthorized access to this endpoint" });

  const keys = await db.query.apikeys.findMany({
    where: { referenceId: session.user.id },
  });

  if (keys.length >= API_KEYS_LIMIT && session.user.role !== "admin") {
    throw new APIError("FORBIDDEN", {
      message: "You have reached the maximum number of API keys. Please delete an existing key before creating a new one",
    });
  }

  if (session.user.role !== "admin") {
    const cooldownKey = `auth:apikey-cooldown:${session.user.id}`;
    const cooldown = await redis.get(cooldownKey);

    if (cooldown) {
      const ttl = await redis.ttl(cooldownKey);
      const daysLeft = Math.ceil(ttl / 86400);
      throw new APIError("TOO_MANY_REQUESTS", {
        message: `You can only create one API key every 7 days. Try again in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
      });
    }

    await redis.setEx(cooldownKey, API_KEY_COOLDOWN_SECONDS, "1");
  }

  if (ctx.body?.metadata) throw new APIError("BAD_REQUEST", { message: "Metadata is not allowed when creating API keys" });
}

async function handleSignUp(ctx: HookCtx) {
  const usernameValue = ctx.body?.username as string | undefined;
  if (!usernameValue || usernameValue.trim().length === 0) throw new APIError("BAD_REQUEST", { message: "Username is required" });
}

const beforeHandlers: Array<{ path: string; handler: (ctx: HookCtx) => Promise<unknown> }> = [
  { path: "/sign-up/email", handler: handleSignUp },
  { path: "/admin/set-user-password", handler: handleSetUserPassword },
  { path: "/api-key/create", handler: handleApiKeyCreate },
];

export const beforeAuthHook = createAuthMiddleware(async (ctx) => {
  for (const { path, handler } of beforeHandlers) {
    if (ctx.path.startsWith(path)) {
      return handler(ctx as HookCtx);
    }
  }
});

export const afterAuthHook = createAuthMiddleware(async (ctx) => {
  if (ctx.path === "/passkey/verify-authentication") {
    const returned = ctx.context.returned as { session?: { userId?: string } } | undefined;
    const userId = returned?.session?.userId;
    if (userId) await redis.setEx(passkeyVerifiedKey(userId), PASSKEY_VERIFIED_TTL, "1");
  }
});
