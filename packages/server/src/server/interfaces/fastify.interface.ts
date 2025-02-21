import type { apiTokens } from "@openbts/drizzle";
import type { InferSelectModel } from "drizzle-orm/table";
import type { FastifyReply, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault, RouteGenericInterface } from "fastify";
import type { SessionPayload } from "./auth.interface.js";

declare module "fastify" {
	export interface FastifyRequest {
		requestStartTime: bigint;
		language: string;
		apiToken?: InferSelectModel<typeof apiTokens>;
		userSession: SessionPayload;
	}

	export interface FastifyContextConfig {
		permissions?: string[];
		allowLoggedIn?: boolean;
	}
}

export type ReplyPayload<Payload extends RouteGenericInterface> = FastifyReply<
	RouteGenericInterface,
	RawServerDefault,
	RawRequestDefaultExpression,
	RawReplyDefaultExpression,
	Payload
>;
