import type { RouteGenericInterface } from "fastify/types/route.js";

export type Route = {
	url: string;
	method: string;
	schema?: Record<string, unknown>;
	attachValidation?: boolean;
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	onRequest?: Function | Function[];
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	handler: Function;
};

export type BasicResponse<T = void> = RouteGenericInterface & {
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
}
