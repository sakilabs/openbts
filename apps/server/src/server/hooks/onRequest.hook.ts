import { getRequestLanguage } from "../i18n/index.js";
import { authHook } from "../middlewares/auth.middleware.js";
import { ipHook } from "./ip.hook.js";

import type { FastifyReply, FastifyRequest } from "fastify";

export async function OnRequestHook(req: FastifyRequest, res: FastifyReply) {
	req.requestStartTime = process.hrtime.bigint();
	req.language = getRequestLanguage(req);

	ipHook(req, res, () => {});
	await authHook(req, res);
}
