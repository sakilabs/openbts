import { stations, cells } from "@openbts/drizzle";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = {
	Body: typeof stations.$inferInsert & { cells: (typeof cells.$inferInsert)[] };
};
type ReqParams = {
	Params: {
		station_id: string;
	};
};
type RequestData = ReqParams & ReqBody;
type ResponseData = typeof stations.$inferSelect;

const schemaRoute = {
	// todo: need
};

async function handler(req: FastifyRequest<RequestData>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { cells: cellsData, ...stationData } = req.body;

	try {
		const station = await db.transaction(async (tx) => {
			const [newStation] = await tx
				.insert(stations)
				.values({
					...stationData,
					last_updated: new Date(),
					date_created: new Date(),
				})
				.returning();

			if (!newStation) {
				tx.rollback();
				throw new ErrorResponse("FAILED_TO_CREATE");
			}

			if (cellsData && cellsData?.length > 0) {
				await tx.insert(cells).values(
					cellsData.map((cell) => ({
						...cell,
						station_id: newStation.id,
						is_confirmed: false,
						last_updated: new Date(),
						date_created: new Date(),
					})),
				);
			}

			return newStation;
		});

		return res.send({ success: true, data: station });
	} catch (error) {
		throw new ErrorResponse("FAILED_TO_CREATE");
	}
}

const createStation: Route<RequestData, ResponseData> = {
	url: "/stations",
	method: "POST",
	config: { permissions: ["write:stations"] },
	handler,
};

export default createStation;
