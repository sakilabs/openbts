export type TokenTier = "basic" | "pro" | "unlimited";
export type UserRole = "guest" | "user" | "moderator" | "admin";
export type TokenType = "user" | "guest" | "refresh";

interface BaseToken {
	sub?: string;
	jti?: string;
	exp?: number;
	iat?: number;
	iss?: string;
	aud?: string;
}

interface UserToken extends BaseToken {
	type: "user";
}

interface Token extends BaseToken {
	type: "guest" | "refresh";
}

export type TokenPayload = UserToken | Token;

export interface UserSessionData {
	scope: string;
	role: UserRole;
}

export interface EnrichedUserToken extends UserToken {
	user: UserSessionData;
}

export type SessionPayload = EnrichedUserToken | Token;
