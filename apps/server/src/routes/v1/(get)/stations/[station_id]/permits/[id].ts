import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { ukePermits, bands, operators } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

const permitsSchema = createSelectSchema(ukePermits);
const bandsSchema = createSelectSchema(bands);
const ukePermitsSchema = createSelectSchema(ukePermits);
const operatorsSchema = createSelectSchema(operators);
type Permit = z.infer<typeof ukePermitsSchema> & {
	band: z.infer<typeof bandsSchema>;
	operator: z.infer<typeof operatorsSchema>;
};

const schemaRoute = {
	params: z.object({
		station_id: z.coerce.number<number>(),
		permit_id: z.coerce.number<number>(),
	}),
	response: {
		200: z.object({
			data: permitsSchema.extend({
				band: bandsSchema,
				operator: operatorsSchema,
			}),
		}),
	},
};
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<Permit>>) {
	const { station_id, permit_id } = req.params;
	if (Number.isNaN(station_id) || Number.isNaN(permit_id)) throw new ErrorResponse("INVALID_QUERY");

	try {
		const station = await db.query.stations.findFirst({
			where: {
				RAW: (fields, { eq }) => eq(fields.id, station_id),
			},
		});
		if (!station) throw new ErrorResponse("NOT_FOUND");

		const permitLink = await db.query.stationsPermits.findFirst({
			where: {
				AND: [{ station_id: { eq: station_id } }, { permit_id: { eq: permit_id } }],
			},
			with: {
				permit: {
					with: {
						band: true,
						operator: true,
					},
				},
			},
		});
		if (!permitLink || !permitLink.permit) throw new ErrorResponse("NOT_FOUND");
		const stationPermit = permitLink.permit;

		return res.send({ data: stationPermit });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const getStationPermit: Route<ReqParams, Permit> = {
	url: "/stations/:station_id/permits/:permit_id",
	method: "GET",
	config: { permissions: ["read:stations", "read:uke_permits"], allowGuestAccess: true },
	schema: schemaRoute,
	handler,
};

export default getStationPermit;
