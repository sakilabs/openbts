import { stationComments, attachments } from "@openbts/drizzle";
import { z } from "zod/v4";
import { createSelectSchema } from "drizzle-zod";
import { inArray } from "drizzle-orm";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { getRuntimeSettings } from "../../../../../../services/settings.service.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

const stationCommentSelectSchema = createSelectSchema(stationComments);
const schemaRoute = {
	body: z
		.object({
			content: z.string().min(1),
			attachments: z
				.array(
					z
						.object({
							uuid: z.string().min(1),
							type: z.string().min(1),
						})
						.strict(),
				)
				.optional(),
		})
		.strict(),
	params: z
		.object({
			station_id: z.string().regex(/^\d+$/),
		})
		.strict(),
	response: {
		201: z
			.object({
				success: z.boolean(),
				data: stationCommentSelectSchema,
			})
			.strict(),
	},
};
type ReqBody = { Body: z.infer<typeof schemaRoute.body> };
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type RequestData = ReqParams & ReqBody;
type ResponseData = z.infer<typeof stationCommentSelectSchema>;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { station_id } = req.params;
	const { content, attachments: commentAttachments } = req.body;
	const userId = req.userSession?.user.id;
	if (!userId) throw new ErrorResponse("UNAUTHORIZED");
	if (Number.isNaN(Number(station_id))) throw new ErrorResponse("INVALID_QUERY");
	if (!content) throw new ErrorResponse("BAD_REQUEST");
	if (!getRuntimeSettings().enableStationComments) throw new ErrorResponse("FORBIDDEN");

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
			})
			.returning();

		if (!newComment) throw new ErrorResponse("FAILED_TO_CREATE");

		return res.code(201).send({ success: true, data: newComment });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const createStationComment: Route<RequestData, ResponseData> = {
	url: "/stations/:station_id/comments",
	method: "POST",
	schema: schemaRoute,
	config: { permissions: ["write:comments"] },
	handler,
};

export default createStationComment;
