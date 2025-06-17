import { stationComments, attachments } from "@openbts/drizzle";
import { inArray } from "drizzle-orm";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

type ReqBody = {
	Body: {
		content: string;
		attachments?: { uuid: string; type: string }[];
	};
};
type ReqParams = {
	Params: {
		station_id: string;
	};
};
type RequestData = ReqParams & ReqBody;
type ResponseData = typeof stationComments.$inferSelect;

// TODO: Add schema validation if needed
// const schemaRoute = {
// 	body: {
// 		type: "object",
// 		properties: {
// 			content: { type: "string" },
// 			attachments: { type: "array", items: { type: "object", properties: { uuid: { type: "string" }, type: { type: "string" } }, required: ["uuid", "type"] } }
// 		},
// 		required: ["content"]
// 	},
// 	params: {
// 		type: "object",
// 		properties: {
// 			station_id: { type: "string" }
// 		},
// 		required: ["station_id"]
// 	}
// };

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { station_id } = req.params;
	const { content, attachments: commentAttachments } = req.body;
	const userId = req.userSession?.user.id;

	if (!userId) throw new ErrorResponse("UNAUTHORIZED");

	if (Number.isNaN(Number(station_id))) throw new ErrorResponse("INVALID_QUERY");

	if (!content) throw new ErrorResponse("BAD_REQUEST");

	try {
		const station = await db.query.stations.findFirst({
			where: (fields, { eq }) => eq(fields.id, Number(station_id)),
		});
		if (!station) throw new ErrorResponse("NOT_FOUND");

		let validatedAttachments: { uuid: string; type: string }[] | null = null;
		if (commentAttachments && commentAttachments.length > 0) {
			const attachmentUuids = commentAttachments.map((att) => att.uuid);
			const existingAttachments = await db.query.attachments.findMany({
				where: inArray(attachments.uuid, attachmentUuids),
				columns: {
					uuid: true,
					mime_type: true,
				},
			});

			const existingUuids = new Set(existingAttachments.map((att) => att.uuid));
			const invalidUuids = attachmentUuids.filter((uuid) => !existingUuids.has(uuid));

			if (invalidUuids.length > 0) throw new ErrorResponse("BAD_REQUEST");

			validatedAttachments = existingAttachments.map((att) => ({
				uuid: att.uuid,
				type: att.mime_type,
			}));
		}

		const [newComment] = await db
			.insert(stationComments)
			.values({
				station_id: Number(station_id),
				user_id: userId,
				content: content,
				attachments: validatedAttachments,
				created_at: new Date(),
				updated_at: new Date(),
			})
			.returning();

		if (!newComment) throw new ErrorResponse("FAILED_TO_CREATE");

		return res.code(201).send({ success: true, data: newComment });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		console.error("Error creating station comment:", error);
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const createStationComment: Route<RequestData, ResponseData> = {
	url: "/stations/:station_id/comments",
	method: "POST",
	// schema: schemaRoute, // Uncomment if schema validation is added
	config: { permissions: ["write:comments"] },
	handler,
};

export default createStationComment;
