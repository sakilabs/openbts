export const ROLE_SCOPES = {
	guest: "read:stations",
	user: "read:stations write:stations read:lists write:lists",
	moderator: "read:* write:*",
	admin: "*",
} as const;
export const API_TOKEN_PREFIX = "Api-Token ";
export const PUBLIC_ROUTES = [];
export const ARGON2_OPTIONS = {
	timeCost: 3,
	memoryCost: 65536,
	parallelism: 4,
	saltLength: 32,
};
