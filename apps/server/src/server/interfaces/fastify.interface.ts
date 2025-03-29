import type { FastifyReply, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault, RouteGenericInterface } from "fastify";
import type { auth } from "../plugins/betterauth.plugin.js";

type Session = typeof auth.$Infer.Session;
type ApiKey = Awaited<ReturnType<typeof auth.api.getApiKey>>;

declare module "fastify" {
	export interface FastifyInstance {
		auth: { handler: (request: Request) => Promise<Response> } | ((request: Request) => Promise<Response>);
	}

	export interface FastifyRequest {
		requestStartTime: bigint;
		language: string;
		apiToken: Omit<ApiKey, "key"> | null;
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
