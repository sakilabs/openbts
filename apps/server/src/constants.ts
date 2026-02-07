export const PUBLIC_ROUTES = ["/api/v1/auth", "/api/v1/stats"];
export const API_KEYS_LIMIT = 1;
export const ARGON2_OPTIONS = {
	timeCost: 3,
	memoryCost: 65536,
	parallelism: 4,
	saltLength: 32,
};
