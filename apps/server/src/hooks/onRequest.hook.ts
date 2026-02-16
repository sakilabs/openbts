import { ipHook } from "./ip.hook.js";

import type { FastifyReply, FastifyRequest } from "fastify";

export async function OnRequestHook(req: FastifyRequest, res: FastifyReply) {
  req.requestStartTime = process.hrtime.bigint();

  ipHook(req, res, () => {});
}
