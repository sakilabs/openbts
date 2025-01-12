import { eq, inArray } from "drizzle-orm/pg-core/expressions";
import { unlink } from "node:fs/promises";

import { db } from "../../../database/index.js";
import { attachments, userNotes } from "../../../database/schemas/notes.js";
import { AuthMiddleware } from "../../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../../interfaces/routes.interface.js";

const removeBTSComment: Route = {
	url: "/bts/:bts_id/notes",
	method: "DELETE",
	attachValidation: true,
	onRequest: AuthMiddleware,
	handler: async (req: FastifyRequest<{ Params: { bts_id: string }; Body: { comment_id: number } }>, res: ReplyPayload<BasicResponse<unknown>>) => {
		const { body } = req;
		const { bts_id } = req.params;
		const { user_id } = req.user as { user_id: number; display_name: string; username: string };

		const btsStation = await db.query.stations.findFirst({
			where: (fields, { eq }) => eq(fields.bts_id, Number(bts_id)),
		});
		if (!btsStation || !btsStation?.mno_id) return res.status(404).send({ success: false, error: "Station not found" });

		const comment = await db.query.userNotes.findFirst({
			where: (fields, { eq }) => eq(fields.comment_id, body.comment_id),
		});

		if (!comment) return res.status(404).send({ success: false, error: "Comment not found" });
		if (comment.user_id !== user_id) return res.status(403).send({ success: false, error: "You are not allowed to delete this comment" });

		const attachmentsNotes = comment?.attachments;
		await db
			.delete(userNotes)
			.where(eq(userNotes.comment_id, body.comment_id))
			.catch((err) => {
				return res.status(500).send({ success: false, error: "Failed to delete comment" });
			});

		if (attachmentsNotes && attachmentsNotes.length > 0) {
			const attachmentIds = attachmentsNotes.map((attachment) => attachment.uuid);
			const resdb = await db
				.delete(attachments)
				.where(inArray(attachments.attachment_uuid, attachmentIds))
				.returning()
				.catch((err) => {
					return res.status(500).send({ success: false, error: "Failed to delete attachments", stack: err });
				});

			await Promise.all(
				resdb.map(async (attachment) => {
					await unlink(`./images/${attachment.attachment_name}`).catch((err) => {
						return res.status(500).send({ success: false, error: "Failed to delete attachment", stack: err });
					});
				}),
			);
		}

		return res.send({ success: true, data: { message: "Komentarz został usunięty" } });
	},
};

export default removeBTSComment;
