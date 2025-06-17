import { attachments } from "@openbts/drizzle";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import fs from "node:fs/promises";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

async function ensureUploadDir() {
	try {
		await fs.mkdir(UPLOAD_DIR, { recursive: true });
	} catch (error) {
		console.error("Failed to create upload directory:", error);
	}
}
ensureUploadDir();

type ResponseData = typeof attachments.$inferSelect;

async function handler(req: FastifyRequest, res: ReplyPayload<JSONBody<ResponseData>>) {
	const userId = req.userSession?.user.id;

	if (!userId)
		throw new ErrorResponse("UNAUTHORIZED");

	const data = await req.file();

	if (!data)
		throw new ErrorResponse("BAD_REQUEST");

	const { file, filename, mimetype, encoding } = data;

	if (!mimetype.startsWith("image/") && !mimetype.startsWith("video/") && mimetype !== "application/pdf") throw new ErrorResponse("BAD_REQUEST");

	const fileExtension = path.extname(filename);
	const uniqueFilename = `${randomUUID()}${fileExtension}`;
	const filePath = path.join(UPLOAD_DIR, uniqueFilename);

	try {
		await pipeline(file, createWriteStream(filePath));

		const stats = await fs.stat(filePath);
		const fileSize = stats.size;

		const [newAttachment] = await db
			.insert(attachments)
			.values({
				name: filename,
				author_id: userId,
				mime_type: mimetype,
				size: fileSize,
			})
			.returning();

		if (!newAttachment) {
			try {
				await fs.unlink(filePath);
			} catch (unlinkError) {
				console.error("Failed to cleanup uploaded file after DB error:", unlinkError);
			}
			throw new ErrorResponse("FAILED_TO_CREATE");
		}

		return res.code(201).send({ success: true, data: newAttachment });
	} catch (error) {
		try {
			await fs.access(filePath);
			await fs.unlink(filePath);
		} catch (cleanupError) {
			console.error("Failed to cleanup uploaded file:", cleanupError);
		}

		if (error instanceof ErrorResponse) throw error;
		console.error("Error uploading attachment:", error);
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const createAttachment: Route<never, ResponseData> = {
	url: "/attachments",
	method: "POST",
	config: { permissions: ["write:attachments"] },
	handler,
};

export default createAttachment;
