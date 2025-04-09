import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { stations, cells } from "@openbts/drizzle";

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
				throw new Error(i18n.t("errors.failedToCreateStation"));
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
		return res.status(500).send({ success: false, error: i18n.t("errors.failedToCreate") });
	}
}

const createStation: Route<RequestData, ResponseData> = {
	url: "/stations",
	method: "POST",
	config: { permissions: ["write:stations"] },
	handler,
};

export default createStation;
