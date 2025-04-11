import { and, lte, gte, eq, type SQL } from "drizzle-orm";
import { ukeRadioLines } from "@openbts/drizzle";

import db from "../../../../../database/psql.js";
import { formatRadioLine } from "../../../../../utils/index.js";
import { ErrorResponse } from "../../../../../errors.js";

import type { FormattedRadioLine } from "@openbts/drizzle/types";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

type ReqQuery = {
	Querystring: RadioLineFilterParams;
};

interface RadioLineFilterParams {
	bounds?: string;
	limit?: number;
	page?: number;
	operator?: string;
}

const schemaRoute = {
	querystring: {
		type: "object",
		properties: {
			bounds: {
				type: "string",
				pattern: "^-?\\d+\\.\\d+,-?\\d+\\.\\d+,-?\\d+\\.\\d+,-?\\d+\\.\\d+$",
			},
			limit: {
				type: "number",
				minimum: 1,
			},
			page: {
				type: "number",
				minimum: 1,
				default: 1,
			},
			operator: {
				type: "string",
			},
		},
	},
	response: {
		200: {
			type: "object",
			properties: {
				success: { type: "boolean" },
				data: {
					type: "array",
					items: {
						type: "object",
						properties: {},
					},
				},
			},
		},
	},
};

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<FormattedRadioLine[]>>) {
	const { limit, page = 1, bounds, operator } = req.query;
	const offset = limit ? (page - 1) * limit : undefined;

	try {
		const conditions: (SQL<unknown> | undefined)[] = [];

		if (bounds) {
			const coords = bounds.split(",").map(Number);
			const [lat1, lon1, lat2, lon2] = coords;
			if (!lat1 || !lon1 || !lat2 || !lon2) throw new ErrorResponse("INVALID_QUERY");

			const [north, south] = lat1 > lat2 ? [lat1, lat2] : [lat2, lat1];
			const [east, west] = lon1 > lon2 ? [lon1, lon2] : [lon2, lon1];

			const txCondition = and(
				lte(ukeRadioLines.tx_latitude, north),
				gte(ukeRadioLines.tx_latitude, south),
				lte(ukeRadioLines.tx_longitude, east),
				gte(ukeRadioLines.tx_longitude, west),
			);

			const rxCondition = and(
				lte(ukeRadioLines.rx_latitude, north),
				gte(ukeRadioLines.rx_latitude, south),
				lte(ukeRadioLines.rx_longitude, east),
				gte(ukeRadioLines.rx_longitude, west),
			);

			conditions.push(and(txCondition, rxCondition));
		}

		if (operator) conditions.push(and(eq(ukeRadioLines.operator_id, Number.parseInt(operator))));

		const radioLinesRes = await db.query.ukeRadioLines.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			with: {
				operator: {
					columns: {
						is_visible: false,
					},
				},
			},
			columns: {
				operator_id: false,
			},
			limit: limit ?? undefined,
			offset: offset,
		});

		const formattedRadioLines = await Promise.all(radioLinesRes.map(formatRadioLine));

		res.send({ success: true, data: formattedRadioLines });
	} catch (error) {
		console.error("Error retrieving UKE radiolines:", error);
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const getUkeRadioLines: Route<ReqQuery, FormattedRadioLine[]> = {
	url: "/uke/radiolines",
	method: "GET",
	schema: schemaRoute,
	config: { permissions: ["read:uke_radiolines"] },
	handler,
};

export default getUkeRadioLines;
