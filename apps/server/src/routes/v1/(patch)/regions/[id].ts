import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { regions } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof regions.$inferInsert };
type ReqParams = { Params: { region_id: string } };
type RequestData = ReqBody & ReqParams;
type ResponseData = typeof regions.$inferSelect;
const regionsUpdateSchema = createUpdateSchema(regions).strict();
const regionsSelectSchema = createSelectSchema(regions);
const schemaRoute = {
	params: z.object({
		region_id: z.string(),
	}),
	body: regionsUpdateSchema,
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: regionsSelectSchema,
		}),
	}),
};

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { region_id } = req.params;

	try {
		const region = await db
			.update(regions)
			.set(req.body)
			.where(eq(regions.id, Number.parseInt(region_id)))
			.returning();
		if (!region.length) throw new ErrorResponse("NOT_FOUND");

		return res.send({ success: true, data: region[0] });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("FAILED_TO_UPDATE");
	}
}

const updateRegion: Route<RequestData, ResponseData> = {
	url: "/regions/:region_id",
	method: "PATCH",
	config: { permissions: ["write:regions"] },
	schema: schemaRoute,
	handler,
};

export default updateRegion;
