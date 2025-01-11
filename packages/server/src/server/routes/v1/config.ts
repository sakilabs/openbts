import { AuthMiddleware } from "../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../interfaces/routes.interface.js";

const configRoute: Route = {
	url: "/config",
	method: "GET",
	attachValidation: true,
	onRequest: AuthMiddleware,
	handler: async (_: FastifyRequest, res: ReplyPayload<BasicResponse<unknown>>) => {
		const inLoginMode = !process.env.PUBLIC_ACCESS;
		const commentsEnabled = process.env.ENABLE_COMMENTS;

		return res.send({ success: true, data: { inLoginMode, commentsEnabled } });
	},
};

export default configRoute;
