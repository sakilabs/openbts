import { and, lte, gte, type SQL } from "drizzle-orm";
import { ukePermits, type bands } from "@openbts/drizzle";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

type ReqQuery = {
	Querystring: PermitFilterParams;
};

interface PermitFilterParams {
	bounds?: string;
	limit?: number;
	page?: number;
	operators?: string;
	tech?: string;
	bands?: string;
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
			tech: {
				type: "string",
				pattern: "^(cdma|umts|gsm|lte|5g)(,(cdma|umts|gsm|lte|5g))*$",
			},
			operators: {
				type: "string",
				pattern: "^\\d+(,\\d+)*$",
			},
			bands: {
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
	const { limit, page = 1, bounds, operators, tech, bands, decisionType } = req.query;
	const offset = limit ? (page - 1) * limit : undefined;

	let bandIds: number[] | undefined;
	if (bands) {
		const requestedBandIds = bands.split(",").map(Number);
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
			if (!lat1 || !lon1 || !lat2 || !lon2) throw new ErrorResponse("INVALID_QUERY");

			const [north, south] = lat1 > lat2 ? [lat1, lat2] : [lat2, lat1];
			const [east, west] = lon1 > lon2 ? [lon1, lon2] : [lon2, lon1];

			conditions.push(
				and(lte(ukePermits.latitude, north), gte(ukePermits.latitude, south), lte(ukePermits.longitude, east), gte(ukePermits.longitude, west)),
			);
		}

		let operatorIds: number[] | undefined;
		if (operators) {
			const operatorQueries = operators.split(",").map((op) => {
				const mnc = Number.parseInt(op);
				if (!Number.isNaN(mnc)) {
					return db.query.operators.findMany({
						columns: { id: true },
						where: (fields, { eq }) => eq(fields.mnc_code, mnc),
					});
				}
			});

			const operatorResults = await Promise.all(operatorQueries);
			const flattenedResults = operatorResults.flat().filter((op): op is NonNullable<typeof op> => op !== undefined);
			operatorIds = flattenedResults.map((op) => op.id);
			if (!operatorIds.length) return res.send({ success: true, data: [] });
		}

		const ukePermitsRes = await db.query.ukePermits.findMany({
			with: {
				band: true,
				operator: {
					columns: {
						is_visible: false,
					},
				},
			},
			where: (fields, { and, inArray, eq }) => {
				if (operatorIds) conditions.push(inArray(fields.operator_id, operatorIds));
				if (bandIds && bandIds.length > 0) conditions.push(inArray(fields.band_id, bandIds));
				if (decisionType) conditions.push(eq(fields.decision_type, decisionType as "zmP" | "P"));

				return conditions.length > 0 ? and(...conditions) : undefined;
			},
			limit: limit ?? undefined,
			offset: offset,
		});

		if (tech) {
			const requestedTechs = tech.toLowerCase().split(",");
			ukePermitsRes.filter((permit) => {
				const bandName = permit.band?.name.toLowerCase();
				return requestedTechs.some((tech) => {
					switch (tech) {
						case "cdma":
							return bandName.includes("cdma");
						case "gsm":
							return bandName.includes("gsm");
						case "umts":
							return bandName.includes("umts");
						case "lte":
							return bandName.includes("lte");
						case "5g":
							return bandName.includes("5g");
						default:
							return false;
					}
				});
			});
		}

		res.send({ success: true, data: ukePermitsRes });
	} catch (error) {
		console.error("Error retrieving UKE permits:", error);
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
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
