import type { FastifyReply, FastifyRequest } from "fastify";

import { ipHook } from "./ip.hook.js";

export async function OnRequestHook(req: FastifyRequest, res: FastifyReply) {
  req.requestStartTime = process.hrtime.bigint();

  ipHook(req, res, () => {});
}
