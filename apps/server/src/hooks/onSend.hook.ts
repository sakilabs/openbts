import type { FastifyReply, FastifyRequest, RequestPayload } from "fastify";

export function OnSendHook(req: FastifyRequest, res: FastifyReply, _: RequestPayload, done: () => void) {
	const duration = process.hrtime.bigint() - req?.requestStartTime;

	res.header("x-response-time", `${(Number(duration) / 1e6).toFixed(3)} ms`);
	done();
}
