import { db } from "../../../database/index.js";
import { userNotes } from "../../../database/schemas/notes.js";
import { AuthMiddleware } from "../../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../../interfaces/routes.interface.js";

const schemaRoute = {
	headers: {
		type: "object",
		properties: {
			Authorization: { type: "string" },
		},
	},
	params: {
		type: "object",
		properties: {
			bts_id: { type: "string" },
		},
	},
	body: {
		type: "object",
		properties: {
			comment_note: { type: "string" },
			attachments: {
				type: "array",
				items: {
					type: "object",
					properties: {
						uuid: { type: "string" },
						type: { type: "string" },
					},
				},
			},
		},
	},
	response: {
		200: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				data: {
					type: "object",
					properties: {
						comment_id: { type: "number" },
						bts_id: { type: "number" },
						author: {
							type: "object",
							properties: {
								id: { type: "number" },
								name: { type: "string" },
							},
						},
						content: { type: ["string", "null"] },
						attachments: {
							type: "array",
							items: { type: "string" },
						},
						created_at: { type: "string" },
					},
				},
			},
		},
	},
};

const addBTSComment: Route = {
	url: "/bts/:bts_id/notes",
	method: "PUT",
	attachValidation: true,
	schema: schemaRoute,
	onRequest: AuthMiddleware,
	handler: async (
		req: FastifyRequest<{ Params: { bts_id: string }; Body: { comment_note?: string; attachments?: { uuid: string; type: string }[] } }>,
		res: ReplyPayload<BasicResponse<unknown>>,
	) => {
		const { body } = req;
		const { bts_id } = req.params;
		const { user_id, display_name } = req.user as { user_id: number; display_name: string; username: string };

		if (!body?.comment_note && !body?.attachments)
			return res.status(403).send({ success: false, error: "Either comment or attachments must be sent" });

		if (body?.attachments) {
			const attachmentUUIDs = body.attachments.map((attachment) => attachment.uuid);
			const attachmentsRes = await db.query.attachments
				.findMany({
					where: (fields, { inArray }) => inArray(fields.attachment_uuid, attachmentUUIDs),
				})
				.catch((err) => {
					return res.status(500).send({ success: false, error: "Error while checking for attachments" });
				});

			const foundUUIDs = new Set(attachmentsRes.map((attachment) => attachment.attachment_uuid));

			for (const attachment of body.attachments) {
				if (!foundUUIDs.has(attachment.uuid)) {
					return res.status(403).send({ success: false, error: "One of attachments is not in the database" });
				}
			}
		}

		const btsStation = await db.query.stations.findFirst({
			where: (fields, { eq }) => eq(fields.bts_id, Number(bts_id)),
		});
		if (!btsStation) return res.status(404).send({ success: false, error: "Station not found" });

		const payload = {
			bts_id: Number(bts_id),
			user_id: user_id,
			comment: body?.comment_note,
			attachments: body?.attachments,
			created_at: new Date(),
		};

		const resdb = await db
			.insert(userNotes)
			.values(payload)
			.returning()
			.catch((err) => {
				return res.status(500).send({ success: false, error: "Failed to insert comment" });
			});

		if (!resdb?.[0]) return res.status(500).send({ success: false, error: "Failed to insert comment" });

		const attachments = await db.query.attachments.findMany({
			where: (fields, { inArray }) => inArray(fields.attachment_uuid, body?.attachments?.map((attachment) => attachment.uuid) ?? []),
		});

		const payloadUser = {
			comment_id: resdb[0].comment_id,
			bts_id: Number(bts_id),
			author: {
				id: user_id,
				name: display_name,
			},
			content: body?.comment_note,
			attachments: attachments?.map((attachment) => attachment.attachment_name),
			created_at: new Date(),
		};

		return res.send({ success: true, data: payloadUser });
	},
};

export default addBTSComment;
