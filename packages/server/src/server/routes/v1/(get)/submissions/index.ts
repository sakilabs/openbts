import db from "../../../../database/psql.js";
import { i18n } from "../../../../i18n/index.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { submissions } from "@openbts/drizzle";
import type { RouteGenericInterface } from "fastify";

type Submission = typeof submissions.$inferSelect;

async function handler(_req: FastifyRequest, res: ReplyPayload<JSONBody<Submission[]>>) {
	const submissions = await db.query.submissions.findMany({
		with: {
			station: true,
			submitter: true,
			reviewer: true,
		},
	});

	return res.send({ success: true, data: submissions });
}

const getSubmissions: Route<RouteGenericInterface, Submission[]> = {
	url: "/submissions",
	method: "GET",
	config: { permissions: ["read:submissions"] },
	handler,
};

export default getSubmissions;
