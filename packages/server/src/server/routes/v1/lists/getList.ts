import { db } from "../../../database/index.js";
import { AuthMiddleware } from "../../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../../interfaces/routes.interface.js";

const getList: Route = {
	url: "/lists/:list_uuid",
	method: "GET",
	attachValidation: true,
	onRequest: AuthMiddleware,
	handler: async (req: FastifyRequest<{ Params: { list_uuid: string } }>, res: ReplyPayload<BasicResponse<unknown>>) => {
		const { list_uuid } = req.params;

		const userList = await db.query.userLists.findFirst({
			where: (fields, { eq }) => eq(fields.list_uuid, list_uuid),
		});
		if (!userList) return res.status(404).send({ success: false, message: "List not found" });

		return res.send({ success: true, data: userList });
	},
};

export default getList;
