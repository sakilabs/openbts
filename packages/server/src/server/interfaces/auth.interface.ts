export type TokenTier = "basic" | "pro" | "unlimited";
export type UserRole = "guest" | "user" | "moderator" | "admin";

export interface APIToken {
	id: number;
	tier: TokenTier;
	scope: string;
}

export interface User {
	user_id?: number;
	type: "guest" | "user";
	role?: UserRole;
	scope?: string;
}

declare module "fastify" {
	interface FastifyRequest {
		apiToken?: APIToken;
	}
}

declare module "@fastify/jwt" {
	interface FastifyJWT {
		user?: User;
	}
}
