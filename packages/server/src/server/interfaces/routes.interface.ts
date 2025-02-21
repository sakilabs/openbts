import type { RouteGenericInterface } from "fastify/types/route.js";

export type Route = {
	url: string;
	method: string;
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	handler: Function;
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	onRequest?: Function[];
	schema?: Record<string, unknown>;
	attachValidation?: boolean;
	config?: {
		permissions?: string[];
		allowLoggedIn?: boolean;
	};
};

export type JSONBody<T = void> = RouteGenericInterface & {
	Reply: Response<T>;
};
type Response<T> = SuccessfulResponse<T> | UnsuccessfulResponse;

interface SuccessfulResponse<T> {
	success: true;
	data?: T;
}

interface UnsuccessfulResponse {
	success: false;
	error: string;
	message?: string;
}
