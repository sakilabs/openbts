import { getRequestLanguage } from "../i18n/index.js";
import { authHook } from "./auth.hook.js";
import { ipHook } from "./ip.hook.js";

import type { FastifyReply, FastifyRequest } from "fastify";

export async function OnRequestHook(req: FastifyRequest, res: FastifyReply, done: () => void) {
	req.requestStartTime = process.hrtime.bigint();
	req.language = getRequestLanguage(req);

	ipHook(req, res, () => {});
	await authHook(req, res);

	done();
}
