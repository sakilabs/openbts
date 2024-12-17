import { eq } from "drizzle-orm/pg-core/expressions";

import { db } from "../../../database/index.js";
import { userLists } from "../../../database/schemas/users.js";
import { AuthMiddleware } from "../../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../../interfaces/routes.interface.js";

const deleteList: Route = {
	url: "/lists/:list_uuid",
	method: "DELETE",
	attachValidation: true,
	onRequest: AuthMiddleware,
	handler: async (req: FastifyRequest<{ Params: { list_uuid: string } }>, res: ReplyPayload<BasicResponse<unknown>>) => {
		const { user_id } = req.user as { user_id: number; display_name: string; username: string };
		if (!user_id) return res.status(403).send({ success: false, message: "Invalid user ID" });

		const { list_uuid } = req.params;

		const userList = await db.query.userLists.findFirst({
			where: (fields, { eq }) => eq(fields.list_uuid, list_uuid),
		});

		if (!userList) return res.status(404).send({ success: false, message: "List not found" });
		if (userList.created_by !== user_id) return res.status(403).send({ success: false, message: "You are not allowed to delete this list" });

		await db
			.delete(userLists)
			.where(eq(userLists.list_uuid, list_uuid))
			.catch((err) => {
				return res.status(500).send({ success: false, error: "Failed to delete the list", stack: err });
			});

		return res.send({ success: true, data: `Lista ${list_uuid} została usunięta` });
	},
};

export default deleteList;
