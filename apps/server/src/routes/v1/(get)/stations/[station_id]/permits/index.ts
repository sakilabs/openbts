import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";
import { ukePermits, bands, operators } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

const ukePermitsSchema = createSelectSchema(ukePermits);
const bandsSchema = createSelectSchema(bands);
const operatorsSchema = createSelectSchema(operators).omit({ is_isp: true });
type Permit = z.infer<typeof ukePermitsSchema> & {
	band?: z.infer<typeof bandsSchema>;
	operator?: z.infer<typeof operatorsSchema>;
};

const schemaRoute = {
	params: z.object({
		station_id: z.coerce.number<number>(),
	}),
	response: {
		200: z.object({
			data: z.array(
				ukePermitsSchema.extend({
					band: bandsSchema.optional(),
					operator: operatorsSchema.optional(),
				}),
			),
		}),
	},
};
type ReqParams = { Params: z.infer<typeof schemaRoute.params> };

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<Permit[]>>) {
	const { station_id } = req.params;
	if (Number.isNaN(station_id)) throw new ErrorResponse("INVALID_QUERY");

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.id, station_id),
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	try {
		const permitsLinks = await db.query.stationsPermits.findMany({
			where: (fields, { eq }) => eq(fields.station_id, station_id),
			with: {
				permit: {
					with: {
						band: true,
						operator: {
							columns: {
								is_isp: false,
							},
						},
					},
				},
			},
		});

		if (!permitsLinks.length) throw new ErrorResponse("NOT_FOUND");

		const stationPermits = permitsLinks.map((link) => link.permit).filter((permit): permit is NonNullable<typeof permit> => permit !== null);
		if (!stationPermits.length) throw new ErrorResponse("NOT_FOUND");

		return res.send({ data: stationPermits });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const getStationPermits: Route<ReqParams, Permit[]> = {
	url: "/stations/:station_id/permits",
	method: "GET",
	config: { permissions: ["read:stations", "read:uke_permits"], allowGuestAccess: true },
	schema: schemaRoute,
	handler,
};

export default getStationPermits;
