import type { FastifyReply, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault, RouteGenericInterface } from "fastify";
import type { auth } from "../plugins/betterauth.plugin.js";

type UserSession = Omit<(typeof auth.$Infer.Session)["user"], "id"> & { id: string };
export type Session = Omit<typeof auth.$Infer.Session, "user"> & { user: UserSession };
type ApiKey = Awaited<ReturnType<typeof auth.api.getApiKey>>;
export type ApiToken = Omit<
	ApiKey,
	"key" | "refillInterval" | "refillAmount" | "lastRefillAt" | "rateLimitEnabled" | "requestCount" | "remaining"
> | null;

declare module "fastify" {
	export interface FastifyInstance {
		auth: { handler: (request: Request) => Promise<Response> } | ((request: Request) => Promise<Response>);
	}

	export interface FastifyRequest {
		requestStartTime: bigint;
		apiToken: ApiToken;
		userSession: Session | null;
	}

	export interface FastifyContextConfig {
		permissions?: string[];
		allowLoggedIn?: boolean;
	}
}

export type ReplyPayload<Payload extends RouteGenericInterface> = Omit<
	FastifyReply<RouteGenericInterface, RawServerDefault, RawRequestDefaultExpression, RawReplyDefaultExpression, Payload>,
	"send"
> & {
	send: (payload: Payload["Reply"]) => FastifyReply;
	status: (statusCode: number) => {
		send: (payload: Payload["Reply"]) => FastifyReply;
	};
};
