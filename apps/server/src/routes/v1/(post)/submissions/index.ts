import { submissions } from "@openbts/drizzle";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const submissionsSelectSchema = createSelectSchema(submissions);
const submissionsInsertSchema = createInsertSchema(submissions)
	.omit({
		submitter_id: true,
		reviewer_id: true,
		reviewed_at: true,
		review_notes: true,
		createdAt: true,
		updatedAt: true,
		status: true,
		type: true,
	})
	.strict();
type ReqBody = { Body: z.infer<typeof submissionsInsertSchema> };
type ResponseData = z.infer<typeof submissionsSelectSchema>;
const schemaRoute = {
	body: submissionsInsertSchema,
	response: {
		200: z.object({
			success: z.boolean(),
			data: submissionsSelectSchema,
		}),
	},
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	try {
		const userSession = req.userSession;
		if (!userSession?.user?.id) throw new ErrorResponse("UNAUTHORIZED");
		const userId = userSession.user.id;

		if (req.body.station_id) {
			const stationId = Number(req.body.station_id);
			if (Number.isNaN(stationId)) throw new ErrorResponse("INVALID_QUERY");

			const station = await db.query.stations.findFirst({
				where: (fields, { eq }) => eq(fields.id, stationId),
			});
			if (!station) {
				throw new ErrorResponse("NOT_FOUND", {
					message: "Station not found for the provided station_id",
				});
			}
		}

		const submission = await db
			.insert(submissions)
			.values({ ...req.body, submitter_id: userId })
			.returning();

		return res.send({ success: true, data: submission[0] });
	} catch {
		throw new ErrorResponse("FAILED_TO_CREATE");
	}
}

const createSubmission: Route<ReqBody, ResponseData> = {
	url: "/submissions",
	method: "POST",
	config: { permissions: ["write:submissions"] },
	schema: schemaRoute,
	handler,
};

export default createSubmission;
