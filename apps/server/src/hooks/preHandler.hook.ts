import { authHook } from "../middlewares/auth.middleware.js";

import type { FastifyReply, FastifyRequest } from "fastify";

export async function PreHandlerHook(req: FastifyRequest, res: FastifyReply) {
	// if (req.validationError)
	// 	return res.status(400).send({
	// 		success: false,
	// 		error: req.validationError,
	// 	});
	await authHook(req, res);
}
