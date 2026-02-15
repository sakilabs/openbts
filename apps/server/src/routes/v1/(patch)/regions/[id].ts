import { eq } from "drizzle-orm";
import { createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { regions } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const regionsUpdateSchema = createUpdateSchema(regions).strict();
const regionsSelectSchema = createSelectSchema(regions);
const schemaRoute = {
	params: z.object({
		region_id: z.coerce.number<number>(),
	}),
	body: regionsUpdateSchema,
	response: {
		200: z.object({
			data: regionsSelectSchema,
		}),
	},
};
type ReqBody = { Body: z.infer<typeof regionsUpdateSchema> };
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };
type RequestData = ReqBody & ReqParams;
type ResponseData = z.infer<typeof regionsSelectSchema>;

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { region_id } = req.params;

	const region = await db.query.regions.findFirst({
		where: {
			id: region_id,
		},
	});
	if (!region) throw new ErrorResponse("NOT_FOUND");

	try {
		const [updated] = await db.update(regions).set(req.body).where(eq(regions.id, region_id)).returning();
		if (!updated) throw new ErrorResponse("FAILED_TO_UPDATE");

		return res.send({ data: updated });
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
