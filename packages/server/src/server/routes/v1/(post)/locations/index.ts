import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";
import { locations } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

type ReqBody = { Body: typeof locations.$inferInsert };
type ResponseData = typeof locations.$inferSelect;

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
	const { region_id, city, address, longitude, latitude } = req.body;

	const location = await db
		.insert(locations)
		.values({
			region_id,
			city,
			address,
			longitude: longitude.toString(),
			latitude: latitude.toString(),
		})
		.returning();

	return res.send({ success: true, data: location[0] });
}

const createLocation: Route<ReqBody, ResponseData> = {
	url: "/locations",
	method: "POST",
	config: { permissions: ["write:locations"] },
	handler,
};

export default createLocation;
