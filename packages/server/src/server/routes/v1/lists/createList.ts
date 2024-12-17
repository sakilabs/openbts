import { nanoid } from "nanoid";

import { db } from "../../../database/index.js";
import { userLists } from "../../../database/schemas/users.js";
import { AuthMiddleware } from "../../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../../interfaces/routes.interface.js";

const routeSchema = {
	headers: {
		type: "object",
		properties: {
			Authorization: { type: "string" },
		},
	},
	body: {
		type: "object",
		properties: {
			stations: { type: "array", items: { type: "number" } },
		},
	},
};

const createList: Route = {
	url: "/lists/new",
	method: "POST",
	schema: routeSchema,
	attachValidation: true,
	onRequest: AuthMiddleware,
	handler: async (req: FastifyRequest<{ Body: { stations: number[] } }>, res: ReplyPayload<BasicResponse<unknown>>) => {
		const { user_id, display_name } = req.user as { user_id: number; display_name: string; username: string };
		if (!user_id) return res.status(403).send({ success: false, message: "Invalid user ID" });

		const { stations } = req.body;

		const userListLength = await db.query.userLists.findMany({
			where: (fields, { eq }) => eq(fields.created_by, user_id),
		});

		const payload = {
			list_uuid: nanoid(16),
			created_by: user_id,
			stations: stations ?? [],
			name: `lista ${display_name} (${userListLength.length + 1})`,
			created_at: new Date(),
		};

		const resdb = await db
			.insert(userLists)
			.values(payload)
			.returning()
			.catch((err) => {
				return res.status(500).send({ success: false, error: "Failed to create new list", stack: err });
			});

		return res.send({ success: true, data: resdb[0] });
	},
};

export default createList;
