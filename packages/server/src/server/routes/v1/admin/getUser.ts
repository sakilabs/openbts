import { eq } from "drizzle-orm";

import { db } from "../../../database/index.js";
import { users } from "../../../database/schemas/users.js";
import { AdminMiddleware } from "../../../middlewares/admin.middleware.js";
import { AuthMiddleware } from "../../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../../interfaces/routes.interface.js";

const getUser: Route = {
	url: "/admin/users/:user_id",
	method: "GET",
	onRequest: [AuthMiddleware, AdminMiddleware],
	handler: async (req: FastifyRequest<{ Params: { user_id: string } }>, res: ReplyPayload<BasicResponse<unknown>>) => {
		const { user_id } = req.params;

		const userData = await db.query.users.findFirst({
			where: eq(users.user_id, Number.parseInt(user_id)),
			with: {
				lists: true,
				notes: true,
			},
			columns: {
				password: false,
			},
		});

		if (!userData) return res.status(404).send({ success: false, message: "User not found" });

		return res.send({ success: true, data: userData });
	},
};

export default getUser;
