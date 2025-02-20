import type { FastifyReply, FastifyRequest } from "fastify";

export function PreHandlerHook(req: FastifyRequest, res: FastifyReply, done: () => void) {
	if (req.validationError)
		return res.status(400).send({
			success: false,
			error: `${req.validationError.validationContext} ${req.validationError.validation[0].message}`,
			validationError: req.validationError,
		});

	done();
}
