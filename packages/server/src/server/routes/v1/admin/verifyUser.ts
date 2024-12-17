import { eq } from "drizzle-orm/pg-core/expressions";

import { db } from "../../../database/index.js";
import { users } from "../../../database/schemas/users.js";
import { AdminMiddleware } from "../../../middlewares/admin.middleware.js";
import { AuthMiddleware } from "../../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../../interfaces/routes.interface.js";

const verifyUser: Route = {
	url: "/admin/users/:user_id/verify",
	method: "POST",
	onRequest: [AuthMiddleware, AdminMiddleware],
	handler: async (req: FastifyRequest<{ Params: { user_id: string } }>, res: ReplyPayload<BasicResponse<unknown>>) => {
		const { user_id } = req.params;

		const result = await db
			.update(users)
			.set({ verified: true })
			.where(eq(users.user_id, Number(user_id)));
		if (!result) return res.status(404).send({ success: false, message: "User not found" });

		return res.send({ success: true });
	},
};

export default verifyUser;
