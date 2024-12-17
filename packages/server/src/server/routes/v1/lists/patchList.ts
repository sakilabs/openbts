import { eq } from "drizzle-orm/pg-core/expressions";

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
	params: {
		type: "object",
		properties: {
			list_uuid: { type: "string" },
		},
	},
	body: {
		type: "object",
		properties: {
			stations: {
				type: "object",
				properties: {
					toAdd: { type: "array", items: { type: "number" } },
					toRemove: { type: "array", items: { type: "number" } },
				},
			},
			name: { type: ["string", "null"] },
		},
	},
};

const updateStations = (currentStations: number[], toAdd: number[] = [], toRemove: number[] = []): number[] => {
	let result = [...currentStations];
	if (toAdd.length > 0) result = [...new Set([...result, ...toAdd])];
	if (toRemove.length > 0) result = result.filter((station) => !toRemove.includes(station));

	return result;
};

const patchList: Route = {
	url: "/lists/:list_uuid",
	method: "PATCH",
	attachValidation: true,
	schema: routeSchema,
	onRequest: AuthMiddleware,
	handler: async (
		req: FastifyRequest<{ Params: { list_uuid: string }; Body: { stations: { toAdd: number[]; toRemove: number[] }; name: string } }>,
		res: ReplyPayload<BasicResponse<unknown>>,
	) => {
		const { user_id } = req.user as { user_id: number; display_name: string; username: string };
		if (!user_id) return res.status(403).send({ success: false, message: "Invalid user ID" });

		const { list_uuid } = req.params;
		const userList = await db.query.userLists.findFirst({
			where: (fields, { eq }) => eq(fields.list_uuid, list_uuid),
		});

		if (!userList) return res.status(404).send({ success: false, message: "List not found" });
		if (userList.created_by !== user_id) return res.status(403).send({ success: false, message: "You are not allowed to modify this list" });

		const { stations, name } = req.body;
		const updatedStations = stations ? updateStations(userList.stations, stations.toAdd, stations.toRemove) : userList.stations;

		const payload: { stations?: number[]; name?: string } = {
			name: name ?? userList.name,
		};

		if (stations) payload.stations = updatedStations;

		const resdb = await db
			.update(userLists)
			.set(payload)
			.where(eq(userLists.list_uuid, list_uuid))
			.returning()
			.catch((err) => {
				return res.status(500).send({ success: false, error: "Failed to modify the list", stack: err });
			});

		return res.send({ success: true, data: resdb[0] });
	},
};

export default patchList;
