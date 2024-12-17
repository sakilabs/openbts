import { nanoid } from "nanoid";
import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { pipeline } from "node:stream/promises";

import { db } from "../../database/index.js";
import { attachments } from "../../database/schemas/notes.js";
import { AuthMiddleware } from "../../middlewares/auth.middleware.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../interfaces/fastify.interface.js";
import type { BasicResponse, Route } from "../../interfaces/routes.interface.js";

const uploadAttachment: Route = {
	url: "/uploadAttachments",
	method: "PUT",
	onRequest: AuthMiddleware,
	handler: async (req: FastifyRequest, res: ReplyPayload<BasicResponse<unknown>>) => {
		const options = { limits: { fileSize: 100000000, files: 10 } };
		const parts = req.files(options);
		const { user_id } = req.user as { user_id: number; display_name: string; username: string };

		if (!parts) return res.status(400).send({ success: false, error: "Zero plików w zapytaniu. Spróbuj dodać zdjęcia ponownie" });

		const fileAttachments: { uuid: string; file: string; type: string }[] = [];

		try {
			for await (const part of parts) {
				const id = nanoid(16);
				const attachment_uuid = nanoid(21);
				const ext = part.filename.split(".").pop() || "";
				if (!ext) continue;
				const newFile = `${id}.${ext}`;

				await pipeline(part.file, createWriteStream(`./images/${newFile}`));
				fileAttachments.push({
					uuid: attachment_uuid,
					file: newFile,
					type: ext,
				});
			}

			await db.insert(attachments).values(
				fileAttachments.map((attachment) => ({
					attachment_name: attachment.file,
					author_id: user_id,
					attachment_uuid: attachment.uuid,
				})),
			);

			return res.send({
				success: true,
				data: fileAttachments.map(({ uuid, type }) => ({ uuid, type })),
			});
		} catch (error) {
			await Promise.all(fileAttachments.map((file) => unlink(`./images/${file.file}`).catch(() => {})));
			return res.status(500).send({
				success: false,
				error: "Nie udało się wrzucić wszystkich plików. Spróbuj ponownie.",
			});
		}
	},
};

export default uploadAttachment;
