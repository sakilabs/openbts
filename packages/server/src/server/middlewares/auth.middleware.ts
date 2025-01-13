import { i18n } from "../i18n/index.js";

import type { FastifyReply, FastifyRequest } from "fastify";

export async function AuthMiddleware(req: FastifyRequest, res: FastifyReply) {
	if (process.env.PUBLIC_ACCESS === "true") return;
	const { headers } = req;
	if (!headers.authorization) res.status(403).send({ success: false, message: i18n.t("errors.invalidCredentials", req.language) });

	try {
		await req.jwtVerify();
	} catch (err) {
		const error = err as { code: string };
		res.status(403).send({ success: false, message: error.code });
	}
}
