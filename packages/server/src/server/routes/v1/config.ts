import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../interfaces/routes.interface.js";

const configRoute: Route = {
	url: "/config",
	method: "GET",
	handler: async (_: FastifyRequest, res: ReplyPayload<BasicResponse<{ inLoginMode: boolean; commentsEnabled: boolean }>>) => {
		const inLoginMode = !process.env.PUBLIC_ACCESS;
		const commentsEnabled = process.env.ENABLE_COMMENTS === "true";

		return res.send({ success: true, data: { inLoginMode, commentsEnabled } });
	},
};

export default configRoute;
