import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";
import { ukePermits, bands, operators } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

type Permit = typeof ukePermits.$inferSelect & { band: typeof bands.$inferSelect; operator: Omit<typeof operators.$inferSelect, "is_visible"> };
const permitsSchema = createSelectSchema(ukePermits);
const bandsSchema = createSelectSchema(bands);
const operatorsSchema = createSelectSchema(operators).omit({ is_visible: true });
const schemaRoute = {
	params: z.object({
		id: z.number(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: permitsSchema.extend({
				band: bandsSchema,
				operator: operatorsSchema,
			}),
		}),
	},
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<Permit>>) {
	const { id } = req.params;

	try {
		const permit = await db.query.ukePermits.findFirst({
			with: {
				band: true,
				operator: {
					columns: {
						is_visible: false,
					},
				},
			},
			where: (fields, { eq }) => eq(fields.id, id),
		});
		if (!permit) throw new ErrorResponse("NOT_FOUND");

		return res.send({
			success: true,
			data: permit,
		});
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const getUkePermit: Route<IdParams, Permit> = {
	url: "/uke/permits/:id",
	method: "GET",
	config: { permissions: ["read:uke_permits"] },
	schema: schemaRoute,
	handler,
};

export default getUkePermit;
