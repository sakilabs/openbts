import { db } from "../../../database/index.js";

import { AdminMiddleware } from "../../../middlewares/admin.middleware.js";
import { AuthMiddleware } from "../../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../../interfaces/routes.interface.js";

const getUsers: Route = {
	url: "/admin/users",
	method: "GET",
	onRequest: [AuthMiddleware, AdminMiddleware],
	handler: async (_: FastifyRequest, res: ReplyPayload<BasicResponse<unknown>>) => {
		const users = await db.query.users.findMany({
			with: {
				lists: true,
				notes: true,
			},
			columns: {
				password: false,
			},
		});

		return res.send({ success: true, data: users });
	},
};

export default getUsers;
