import type { FastifyReply, FastifyRequest } from "fastify";

export function OnRequestHook(req: FastifyRequest, res: FastifyReply, done: () => void) {
	req.requestStartTime = process.hrtime.bigint();

	done();
}
