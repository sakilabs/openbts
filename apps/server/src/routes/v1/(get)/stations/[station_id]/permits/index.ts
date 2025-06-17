import db from "../../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../../errors.js";

import type { ukePermits, bands, operators } from "@openbts/drizzle";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../../interfaces/routes.interface.js";

type Permit = typeof ukePermits.$inferSelect & {
	band?: typeof bands.$inferSelect;
	operator?: Omit<typeof operators.$inferSelect, "is_visible">;
};
type ReqParams = {
	Params: {
		station_id: string;
	};
};

async function handler(req: FastifyRequest<ReqParams>, res: ReplyPayload<JSONBody<Permit[]>>) {
	const { station_id } = req.params;

	if (Number.isNaN(Number(station_id))) throw new ErrorResponse("INVALID_QUERY");

	const station = await db.query.stations.findFirst({
		where: (fields, { eq }) => eq(fields.id, Number(station_id)),
	});
	if (!station) throw new ErrorResponse("NOT_FOUND");

	try {
		const permitsLinks = await db.query.stationsPermits.findMany({
			where: (fields, { eq }) => eq(fields.station_id, Number(station_id)),
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

		if (!permitsLinks.length) throw new ErrorResponse("NOT_FOUND");

		const stationPermits = permitsLinks.map((link) => link.permit).filter((permit): permit is NonNullable<typeof permit> => permit !== null);
		if (!stationPermits.length) throw new ErrorResponse("NOT_FOUND");

		return res.send({ success: true, data: stationPermits });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		console.error("Error retrieving station permits:", error);
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const getStationPermits: Route<ReqParams, Permit[]> = {
	url: "/stations/:station_id/permits",
	method: "GET",
	config: { permissions: ["read:stations", "read:uke_permits"] },
	handler,
};

export default getStationPermits;
