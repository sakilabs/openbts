import type { FastifyReply, FastifyRequest } from "fastify";
import { getRequestLanguage } from "../i18n/index.js";

export function OnRequestHook(req: FastifyRequest, res: FastifyReply, done: () => void) {
	req.requestStartTime = process.hrtime.bigint();
	req.language = getRequestLanguage(req);

	done();
}
