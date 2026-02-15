import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { bands } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const bandsUpdateSchema = createUpdateSchema(bands);
const bandsSelectSchema = createSelectSchema(bands);
const schemaRoute = {
	params: z.object({
		band_id: z.coerce.number<number>(),
	}),
	body: bandsUpdateSchema,
	response: {
		200: z.object({
			data: bandsSelectSchema,
		}),
	},
};
type ReqBody = { Body: z.infer<typeof bandsUpdateSchema> };
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type RequestData = ReqBody & ReqParams;
type ResponseData = z.infer<typeof bandsSelectSchema>;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { band_id } = req.params;

	const band = await db.query.bands.findFirst({
		where: {
			id: band_id,
		},
	});
	if (!band) throw new ErrorResponse("NOT_FOUND");

	try {
		const [updated] = await db.update(bands).set(req.body).where(eq(bands.id, band_id)).returning();
		if (!updated) throw new ErrorResponse("FAILED_TO_UPDATE");

		return res.send({ data: updated });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("FAILED_TO_UPDATE");
	}
}

const updateBand: Route<RequestData, ResponseData> = {
	url: "/bands/:band_id",
	method: "PATCH",
	config: { permissions: ["write:bands"] },
	schema: schemaRoute,
	handler,
};

export default updateBand;
