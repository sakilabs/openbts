import db from "../../../database/psql.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../interfaces/routes.interface.js";

const configRoute: Route = {
	url: "/config",
	method: "GET",
	handler: async (_: FastifyRequest, res: ReplyPayload<JSONBody<Record<string, unknown>>>) => {
		const query = await db.query.siteConfig.findMany({
			columns: {
				key: true,
				value: true,
			},
		});

		const transformValue = (value: string) => {
			if (value.toLowerCase() === "true" || value === "1") return true;
			if (value.toLowerCase() === "false" || value === "0") return false;

			const num = Number(value);
			if (!Number.isNaN(num)) return num;

			return value;
		};

		const configObject = query.reduce(
			(acc, { key, value }) => {
				acc[key] = transformValue(value);
				return acc;
			},
			{} as Record<string, unknown>,
		);

		return res.send({ success: true, data: configObject });
	},
};

export default configRoute;
