export const ROLE_SCOPES = {
	guest: "read:stations",
	user: "read:stations write:stations read:lists write:lists",
	moderator: "read:* write:*",
	admin: "*",
} as const;
export const API_TOKEN_PREFIX = "Api-Token ";
export const BEARER_PREFIX = "Bearer ";
export const PUBLIC_ROUTES = ["/guest-token", "/auth/login", "/auth/register"];
