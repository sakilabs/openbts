export const ROLE_SCOPES = {
	guest: "read:stations",
	user: "read:stations write:stations read:lists write:lists",
	moderator: "read:* write:*",
	admin: "*",
} as const;
export const API_TOKEN_PREFIX = "Api-Token ";
export const BEARER_PREFIX = "Bearer ";
export const PUBLIC_ROUTES = ["/auth/guest-token", "/auth/login", "/auth/register"];
export const REDIS_SESSION_PREFIX = "session:";
export const REDIS_USER_SESSIONS_PREFIX = "user_sessions:";
export const REDIS_REVOKED_TOKEN_PREFIX = "revoked_token:";
export const REDIS_REVOKED_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days
export const GUEST_TOKEN_EXPIRATION = 24 * 60 * 60; // 24 hours
