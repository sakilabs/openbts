import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { and, lte, gte, eq, type SQL } from "drizzle-orm";
import { ukeRadioLines, operators } from "@openbts/drizzle";

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

const ukeRadioLinesSchema = createSelectSchema(ukeRadioLines).omit({ operator_id: true });
const operatorsSchema = createSelectSchema(operators).omit({ is_visible: true });
const schemaRoute = {
	querystring: z.object({
		bounds: z
			.string()
			.regex(/^-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+$/)
			.optional(),
		limit: z.number().min(1).optional(),
		page: z.number().min(1).default(1),
		operator: z.string().optional(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: z.array(ukeRadioLinesSchema.extend({ operator: operatorsSchema })),
		}),
	},
};

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<FormattedRadioLine[]>>) {
	const { limit = undefined, page = 1, bounds, operator } = req.query;
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
			limit: limit,
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
