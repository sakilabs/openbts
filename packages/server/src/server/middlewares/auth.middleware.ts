import type { FastifyReply, FastifyRequest } from "fastify";

export async function AuthMiddleware(req: FastifyRequest, res: FastifyReply) {
	if (process.env.PUBLIC_ACCESS === "true") return;
	const { headers } = req;
	if (!headers.authorization) res.status(403).send({ success: false, message: "No token was passed" });

	try {
		await req.jwtVerify();
	} catch (err) {
		const error = err as { code: string };
		res.status(403).send({ success: false, message: error.code });
	}
}
