import type { FastifyReply, FastifySchema } from "fastify";
import type { RouteGenericInterface } from "fastify/types/route.js";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "./fastify.interface.js";

export type Route<T extends RouteGenericInterface = RouteGenericInterface, U = unknown> = {
	url: string;
	method: string;
	handler: (req: FastifyRequest<T>, res: ReplyPayload<JSONBody<U> | SuccessResponse>) => Promise<void> | void;
	onRequest?: ((req: FastifyRequest, res: FastifyReply, done: (err?: Error) => void) => void)[];
	config?: {
		permissions?: string[];
		allowLoggedIn?: boolean;
	};
	schema?: FastifySchema;
};

export type JSONBody<T = void> = RouteGenericInterface & {
	Reply: Response<T>;
};

export type SuccessResponse = RouteGenericInterface & {
	Reply: { success: true };
};

type Response<T> = SuccessfulResponse<T>;

interface SuccessfulResponse<T> {
	success: true;
	data?: T;
}

export type IdParams = { Params: { id: number } };
