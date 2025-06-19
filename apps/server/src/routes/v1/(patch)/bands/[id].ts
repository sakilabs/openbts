import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { bands } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const bandsUpdateSchema = createUpdateSchema(bands);
const bandsSelectSchema = createSelectSchema(bands);
type ReqBody = { Body: z.infer<typeof bandsUpdateSchema> };
type ReqParams = { Params: { band_id: number } };
type RequestData = ReqBody & ReqParams;
type ResponseData = z.infer<typeof bandsSelectSchema>;
const schemaRoute = {
	params: z.object({
		band_id: z.number(),
	}),
	body: bandsUpdateSchema,
	response: {
		200: z.object({
			success: z.boolean(),
			data: bandsSelectSchema,
		}),
	},
};

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { band_id } = req.params;

	try {
		const band = await db.update(bands).set(req.body).where(eq(bands.id, band_id)).returning();
		if (!band.length) throw new ErrorResponse("NOT_FOUND");

		return res.send({ success: true, data: band[0] });
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
