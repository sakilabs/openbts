import { db } from "../../../database/index.js";
import { AuthMiddleware } from "../../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../../interfaces/routes.interface.js";

const listMe: Route = {
	url: "/lists/@me",
	method: "GET",
	attachValidation: true,
	onRequest: AuthMiddleware,
	handler: async (req: FastifyRequest, res: ReplyPayload<BasicResponse<unknown>>) => {
		const { user_id } = req.user as { user_id: number; display_name: string; username: string };

		const userLists = await db.query.userLists.findMany({
			where: (fields, { eq }) => eq(fields.created_by, user_id),
		});

		return res.send({ success: true, data: userLists });
	},
};

export default listMe;
