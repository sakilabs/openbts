import { auth } from "../../plugins/betterauth.plugin.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { FastifyReply } from "fastify";

async function handler(req: FastifyRequest, res: FastifyReply) {
	try {
		const url = new URL(req.url, `http://${req.headers.host}`);

		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (value) headers.append(key, value.toString());
		}

		const request = new Request(url.toString(), {
			method: req.method,
			headers,
			body: req.body ? JSON.stringify(req.body) : undefined,
		});

		const response = await auth.handler(request);

		res.status(response.status);
		response.headers.forEach((value, key) => res.header(key, value));
		if (response.status === 500) {
			res.send({
				success: false,
				error: "Internal authentication error",
				code: "AUTH_FAILURE",
			});
			return;
		}
		res.send(response.body ? await response.text() : null);
	} catch (error) {
		console.error("Authentication Error:", error);
		res.status(500).send({
			success: false,
			error: "Internal authentication error",
			code: "AUTH_FAILURE",
		});
	}
}

const authRoutes = {
	url: "/auth/*",
	method: ["GET", "POST"],
	handler,
};

export default authRoutes;
