import { db } from "../../../database/index.js";
import { AuthMiddleware } from "../../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../../interfaces/routes.interface.js";

const schemaRoute = {
	params: {
		type: "object",
		properties: {
			bts_id: { type: "string" },
		},
	},
	response: {
		200: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				data: {
					type: "array",
					items: {
						type: "object",
						properties: {
							comment_id: { type: "number" },
							bts_id: { type: "number" },
							content: { type: "string" },
							author: {
								type: "object",
								properties: {
									id: { type: "number" },
									name: { type: "string" },
								},
							},
							datePosted: { type: "string" },
							attachments: {
								type: "array",
								items: { type: "string" },
							},
						},
					},
				},
			},
		},
	},
};

interface NotePayload {
	comment_id?: number;
	bts_id: number;
	content: string;
	author: {
		id: number;
		name: string;
	};
	datePosted?: Date;
	attachments?: string[];
}

const getBTSNotes: Route = {
	url: "/bts/:bts_id/notes",
	method: "GET",
	schema: schemaRoute,
	onRequest: AuthMiddleware,
	handler: async (req: FastifyRequest<{ Params: { bts_id: string } }>, res: ReplyPayload<BasicResponse<unknown>>) => {
		const { bts_id } = req.params;
		if (!bts_id || Number.isNaN(Number(bts_id))) {
			return res.status(400).send({
				success: false,
				error: "Invalid bts_id",
			});
		}
		const btsStation = await db.query.stations.findFirst({
			where: (fields, { eq }) => eq(fields.bts_id, Number(bts_id)),
		});

		if (!btsStation) {
			return res.status(404).send({
				success: false,
				error: "Station not found",
			});
		}

		const [systemNote, userNotes] = await Promise.all([
			db.query.systemNotes.findFirst({
				where: (fields, { eq }) => eq(fields.bts_id, Number(bts_id)),
			}),
			db.query.userNotes.findMany({
				where: (fields, { eq }) => eq(fields.bts_id, Number(bts_id)),
				with: {
					user: true,
				},
			}),
		]);
		const notes: NotePayload[] = [];

		if (systemNote) {
			notes.push({
				bts_id: systemNote.bts_id,
				content: systemNote.note ?? "",
				author: {
					id: 0,
					name: "Notka systemowa",
				},
			});
		}

		const attachmentUUIDs = userNotes.filter((note) => note.attachments?.length).flatMap((note) => note.attachments?.map((att) => att.uuid) ?? []);

		const attachments = attachmentUUIDs.length
			? await db.query.attachments.findMany({
					where: (fields, { inArray }) => inArray(fields.attachment_uuid, attachmentUUIDs),
				})
			: [];

		const attachmentMap = new Map(attachments.map((att) => [att.attachment_uuid, att.attachment_name]));

		const userNotePayloads = userNotes.map((note) => ({
			comment_id: note.comment_id,
			bts_id: note.bts_id,
			content: note.comment ?? "",
			author: {
				id: note.user.user_id,
				name: note.user.display_name,
			},
			datePosted: note.created_at,
			...(note.attachments && {
				attachments: note.attachments.map((att) => attachmentMap.get(att.uuid)).filter((name): name is string => name !== undefined),
			}),
		}));

		notes.push(...userNotePayloads);

		return res.send({ success: true, data: notes });
	},
};

export default getBTSNotes;
