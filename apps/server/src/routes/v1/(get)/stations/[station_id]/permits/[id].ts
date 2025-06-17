import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { ukePermits, bands, operators } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

type Permit = typeof ukePermits.$inferSelect & {
	band: typeof bands.$inferSelect;
	operator: Omit<typeof operators.$inferSelect, "is_visible">;
};
type ReqParams = {
	Params: {
		station_id: string;
		permit_id: string;
	};
};
const permitsSchema = createSelectSchema(ukePermits);
const bandsSchema = createSelectSchema(bands);
const operatorsSchema = createSelectSchema(operators).omit({ is_visible: true });
const schemaRoute = {
	params: z.object({
		station_id: z.string(),
		permit_id: z.string(),
	}),
	response: z.object({
		200: z.object({
			success: z.boolean(),
			data: permitsSchema.extend({
				band: bandsSchema,
				operator: operatorsSchema,
			}),
		}),
	}),
};

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<Permit>>) {
	const { station_id, permit_id } = req.params;
	const stationId = Number(station_id);
	const permitId = Number(permit_id);

	if (Number.isNaN(stationId) || Number.isNaN(permitId)) throw new ErrorResponse("INVALID_QUERY");

	try {
		const station = await db.query.stations.findFirst({
			where: (fields, { eq }) => eq(fields.id, stationId),
		});
		if (!station) throw new ErrorResponse("NOT_FOUND");

		const permitLink = await db.query.stationsPermits.findFirst({
			where: (fields, { and, eq }) => and(eq(fields.station_id, stationId), eq(fields.permit_id, permitId)),
			with: {
				permit: {
					with: {
						band: true,
						operator: {
							columns: {
								is_visible: false,
							},
						},
					},
				},
			},
		});
		if (!permitLink || !permitLink.permit) throw new ErrorResponse("NOT_FOUND");
		const stationPermit = permitLink.permit;

		return res.send({ success: true, data: stationPermit });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const getStationPermit: Route<ReqParams, Permit> = {
	url: "/stations/:station_id/permits/:permit_id",
	method: "GET",
	config: { permissions: ["read:stations", "read:uke_permits"] },
	schema: schemaRoute,
	handler,
};

export default getStationPermit;
