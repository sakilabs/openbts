import { db } from "../../database/index.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../interfaces/routes.interface.js";

const meInfo: Route = {
	url: "/@me",
	method: "GET",
	attachValidation: true,
	onRequest: AuthMiddleware,
	handler: async (req: FastifyRequest, res: ReplyPayload<BasicResponse<unknown>>) => {
		const { user_id } = req.user as { user_id: number; display_name: string; username: string };
		if (!user_id) return res.status(403).send({ success: false, message: "Invalid user ID" });

		const user = await db.query.users.findFirst({
			where: (fields, { eq }) => eq(fields.user_id, user_id),
			columns: {
				password: false,
			},
		});
		if (!user) return res.status(403).send({ success: false, message: "User has not been found" });

		return res.send({ success: true, data: user });
	},
};

export default meInfo;
