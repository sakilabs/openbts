import db from "../../../../../database/psql.js";
import { i18n } from "../../../../../i18n/index.js";
import { and, lte, gte, type SQL } from "drizzle-orm";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";
import { ukePermits, type bands } from "@openbts/drizzle";

type ReqQuery = {
	Querystring: PermitFilterParams;
};

interface PermitFilterParams {
	bounds?: string;
	limit?: number;
	page?: number;
	operator?: string;
	band?: string;
	decisionType?: string;
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
			band: {
				type: "string",
				pattern: "^\\d+(,\\d+)*$",
			},
			decisionType: {
				type: "string",
				enum: ["zmP", "P"],
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

type Permit = typeof ukePermits.$inferSelect & { band?: typeof bands.$inferSelect };

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<Permit[]>>) {
	const { limit, page = 1, bounds, operator, band, decisionType } = req.query;
	const offset = limit ? (page - 1) * limit : undefined;

	let bandIds: number[] | undefined;
	if (band) {
		const requestedBandIds = band.split(",").map(Number);
		const validBands = await db.query.bands.findMany({
			columns: { id: true },
			where: (fields, { inArray }) => inArray(fields.value, requestedBandIds),
		});

		bandIds = validBands.map((band) => band.id);
		if (bandIds.length === 0) return res.send({ success: true, data: [] });
	}

	try {
		const conditions: (SQL<unknown> | undefined)[] = [];

		if (bounds) {
			const coords = bounds.split(",").map(Number);
			const [lat1, lon1, lat2, lon2] = coords;
			if (!lat1 || !lon1 || !lat2 || !lon2) {
				return res.status(400).send({
					success: false,
					error: i18n.t("errors.invalidFormat", req.language),
				});
			}

			const [north, south] = lat1 > lat2 ? [lat1, lat2] : [lat2, lat1];
			const [east, west] = lon1 > lon2 ? [lon1, lon2] : [lon2, lon1];

			conditions.push(
				and(lte(ukePermits.latitude, north), gte(ukePermits.latitude, south), lte(ukePermits.longitude, east), gte(ukePermits.longitude, west)),
			);
		}

		const ukePermitsRes = await db.query.ukePermits.findMany({
			with: {
				band: true,
			},
			where: (_, { and, like, inArray, eq }) => {
				if (operator) conditions.push(like(ukePermits.operator_name, `%${operator}%`));
				if (bandIds && bandIds.length > 0) conditions.push(inArray(ukePermits.band_id, bandIds));
				if (decisionType) conditions.push(eq(ukePermits.decision_type, decisionType as "zmP" | "P"));

				return conditions.length > 0 ? and(...conditions) : undefined;
			},
			limit: limit ?? undefined,
			offset: offset,
		});

		res.send({ success: true, data: ukePermitsRes });
	} catch (error) {
		console.error("Error retrieving UKE permits:", error);
		return res.status(500).send({
			success: false,
			error: i18n.t("errors.internalServerError", req.language),
		});
	}
}

const getUkePermits: Route<ReqQuery, Permit[]> = {
	url: "/uke/permits",
	method: "GET",
	schema: schemaRoute,
	config: { permissions: ["read:uke_permits"] },
	handler,
};

export default getUkePermits;
