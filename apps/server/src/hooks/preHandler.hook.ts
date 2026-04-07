import type { FastifyReply, FastifyRequest } from "fastify";

import { authHook } from "../middlewares/auth.middleware.js";

export async function PreHandlerHook(req: FastifyRequest, res: FastifyReply) {
  await authHook(req, res);
}
