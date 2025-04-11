import { authHook } from "../middlewares/auth.middleware.js";
import { ipHook } from "./ip.hook.js";

import type { FastifyReply, FastifyRequest } from "fastify";

export async function OnRequestHook(req: FastifyRequest, res: FastifyReply) {
	req.requestStartTime = process.hrtime.bigint();

	ipHook(req, res, () => {});
	await authHook(req, res);
}
