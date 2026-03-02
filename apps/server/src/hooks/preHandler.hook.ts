import { authHook } from "../middlewares/auth.middleware.js";

import type { FastifyReply, FastifyRequest } from "fastify";

export async function PreHandlerHook(req: FastifyRequest, res: FastifyReply) {
  await authHook(req, res);
}
