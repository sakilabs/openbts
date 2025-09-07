import { z } from "zod/v4";
import { createSelectSchema } from "drizzle-zod";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import fs from "node:fs/promises";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { getRuntimeSettings } from "../../../../../../services/settings.service.js";
import { stationComments, attachments } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";
import type { MultipartFile, MultipartValue } from "@fastify/multipart";

const stationCommentSelectSchema = createSelectSchema(stationComments);
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

async function ensureUploadDir() {
	try {
		await fs.mkdir(UPLOAD_DIR, { recursive: true });
	} catch {}
}
const schemaRoute = {
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

type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type RequestData = ReqParams;
type ResponseData = z.infer<typeof stationCommentSelectSchema>;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { station_id } = req.params;
	const isMultipart = (req.headers["content-type"] ?? "").includes("multipart/form-data");
	const userId = req.userSession?.user.id;
	if (!userId) throw new ErrorResponse("UNAUTHORIZED");
	if (Number.isNaN(Number(station_id))) throw new ErrorResponse("INVALID_QUERY");
	if (!getRuntimeSettings().enableStationComments) throw new ErrorResponse("FORBIDDEN");
	if (!isMultipart) throw new ErrorResponse("BAD_REQUEST");

	try {
		const station = await db.query.stations.findFirst({
			where: (fields, { eq }) => eq(fields.id, Number(station_id)),
		});
		if (!station) throw new ErrorResponse("NOT_FOUND");

		let content: string | undefined;
		const validatedAttachments: { uuid: string; type: string }[] | null = [];

		await ensureUploadDir();
		const savedPaths: string[] = [];
		try {
			for await (const part of (req as unknown as { parts: () => AsyncIterableIterator<MultipartFile | MultipartValue> }).parts()) {
				if ((part as MultipartFile).type === "file" && (part as MultipartFile).file) {
					const filePart = part as MultipartFile;
					const mimetype: string = filePart.mimetype;
					if (!mimetype.startsWith("image/") && !mimetype.startsWith("video/") && mimetype !== "application/pdf")
						throw new ErrorResponse("BAD_REQUEST");
					const fileExtension = path.extname(filePart.filename ?? "");
					const uniqueFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}${fileExtension}`;
					const filePath = path.join(UPLOAD_DIR, uniqueFilename);
					savedPaths.push(filePath);
					await pipeline(filePart.file, createWriteStream(filePath));
					const stats = await fs.stat(filePath);
					const fileSize = stats.size;
					const [newAttachment] = await db
						.insert(attachments)
						.values({ name: filePart.filename ?? uniqueFilename, author_id: userId, mime_type: mimetype, size: fileSize })
						.returning();
					if (!newAttachment) throw new ErrorResponse("FAILED_TO_CREATE");
					(validatedAttachments as { uuid: string; type: string }[]).push({ uuid: newAttachment.uuid, type: newAttachment.mime_type });
					continue;
				}

				if ((part as MultipartValue).type === "field") {
					const field = part as MultipartValue;
					if (field.fieldname === "content") content = String(field.value ?? "");
				}
			}
		} catch {
			await Promise.all(
				savedPaths.map(async (p) => {
					try {
						await fs.access(p);
						await fs.unlink(p);
					} catch {}
				}),
			);
			throw new ErrorResponse("INTERNAL_SERVER_ERROR");
		}

		if (!content) throw new ErrorResponse("BAD_REQUEST");

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
