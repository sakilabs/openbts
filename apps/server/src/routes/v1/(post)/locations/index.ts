import { locations } from "@openbts/drizzle";
import { createSelectSchema, createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof locations.$inferInsert };
type ResponseData = typeof locations.$inferSelect;
const locationsSelectSchema = createSelectSchema(locations).strict();
const locationsInsertSchema = createInsertSchema(locations);
const schemaRoute = {
	body: locationsInsertSchema,
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: locationsSelectSchema,
		}),
	}),
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { region_id, city, address, longitude, latitude } = req.body;

	try {
		const location = await db.insert(locations).values({ region_id, city, address, longitude, latitude }).returning();

		return res.send({ success: true, data: location[0] });
	} catch {
		throw new ErrorResponse("FAILED_TO_CREATE");
	}
}

const createLocation: Route<ReqBody, ResponseData> = {
	url: "/locations",
	method: "POST",
	config: { permissions: ["write:locations"] },
	schema: schemaRoute,
	handler,
};

export default createLocation;
