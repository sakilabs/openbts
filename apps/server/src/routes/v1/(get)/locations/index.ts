import { createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { locations, regions } from "@openbts/drizzle";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { SQL } from "drizzle-orm";

const locationsSchema = createSelectSchema(locations).omit({ point: true, region_id: true });
const regionsSchema = createSelectSchema(regions);

const schemaRoute = {
	querystring: z
		.object({
			bounds: z
				.string()
				.regex(/^-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+$/)
				.optional(),
		})
		.optional(),
	response: {
		200: z.object({
			success: z.boolean(),
			data: z.array(
				locationsSchema.extend({
					region: regionsSchema,
				}),
			),
		}),
	},
};
type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };
type ResponseData = z.infer<typeof locationsSchema> & { region: z.infer<typeof regionsSchema> };

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResponseData[]>>) {
	const { bounds } = req.query ?? {};

	let whereClause: SQL | undefined;
	if (bounds) {
		const splitBounds = bounds.split(",").map(Number);
		if (splitBounds.length !== 4 || splitBounds.some(Number.isNaN)) throw new ErrorResponse("BAD_REQUEST");
		const [la1, lo1, la2, lo2] = splitBounds as [number, number, number, number];
		const [west, south] = [Math.min(lo1, lo2), Math.min(la1, la2)];
		const [east, north] = [Math.max(lo1, lo2), Math.max(la1, la2)];

		whereClause = sql`ST_Intersects(${locations.point}, ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326))`;
	}

	const locationRows = await db.query.locations.findMany({
		with: {
			region: true,
		},
		columns: {
			point: false,
			region_id: false,
		},
		where: whereClause,
	});
	return res.send({ success: true, data: locationRows });
}

const getLocations: Route<ReqQuery, ResponseData[]> = {
	url: "/locations",
	method: "GET",
	config: { permissions: ["read:locations"], allowGuestAccess: true },
	schema: schemaRoute,
	handler,
};

export default getLocations;
