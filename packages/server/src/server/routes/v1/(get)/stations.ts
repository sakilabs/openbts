import db from "../../../database/index.js";
import { AuthMiddleware } from "../../../middlewares/auth.middleware.js";
import { i18n } from "../../../i18n/index.js";

import type { FastifyRequest } from "fastify";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../interfaces/routes.interface.js";
import type { stations } from "@openbts/drizzle";

interface StationFilterParams {
	boundaries?: string;
	limit?: number;
	page?: number;
	tech?: string;
	operators?: string;
	bands?: string;
}

const schemaRoute = {
	querystring: {
		type: "object",
		properties: {
			boundaries: {
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
						properties: {
							bts_id: { type: "number" },
							latitude: { type: "number" },
							longitude: { type: "number" },
							owner: { type: ["number", "null"] },
							type: { type: ["string", "null"] },
							region: { type: ["number", "null"] },
							mno_id: { type: ["number", "null"] },
							networks_id: { type: ["number", "null"] },
							location_type: { type: ["string", "null"] },
						},
					},
				},
			},
		},
	},
};

const getStations: Route = {
	url: "/stations",
	method: "GET",
	schema: schemaRoute,
	onRequest: AuthMiddleware,
	handler: async (req: FastifyRequest<{ Querystring: StationFilterParams }>, res: ReplyPayload<JSONBody<typeof stations>>) => {
		const { limit, page = 1, boundaries, tech, operators, bands } = req.query;
		const offset = (page - 1) * (limit ?? 0);

		let locationIds: number[] | undefined;

		if (boundaries) {
			const coords = boundaries.split(",").map(Number);
			const [lat1, lon1, lat2, lon2] = coords;
			if (!lat1 || !lon1 || !lat2 || !lon2) return res.status(400).send({ success: false, error: "Invalid boundaries" });

			const [north, south] = lat1 > lat2 ? [lat1, lat2] : [lat2, lat1];
			const [east, west] = lon1 > lon2 ? [lon1, lon2] : [lon2, lon1];

			const boundaryLocations = await db.query.locations.findMany({
				columns: { id: true },
				where: (fields, { and, lte, gte }) =>
					and(
						lte(fields.latitude, north.toString()),
						gte(fields.latitude, south.toString()),
						lte(fields.longitude, east.toString()),
						gte(fields.longitude, west.toString()),
					),
			});

			locationIds = boundaryLocations.map((loc) => loc.id);
			if (!locationIds.length) return res.send({ success: true, data: [] });
		}

		let bandIds: number[] | undefined;
		if (bands) {
			const requestedBandIds = bands.split(",").map(Number);
			const validBands = await db.query.bands.findMany({
				columns: { id: true },
				where: (fields, { inArray }) => inArray(fields.value, requestedBandIds),
			});

			bandIds = validBands.map((band) => band.id);
			if (!bandIds.length) return res.send({ success: true, data: [] });
		}

		const btsStations = await db.query.stations.findMany({
			with: {
				cells: {
					where: (fields, { inArray }) => (bandIds ? inArray(fields.band_id, bandIds) : undefined),
				},
			},
			where: (fields, { and, eq, inArray, or }) => {
				const conditions = [];
				if (locationIds) conditions.push(inArray(fields.location_id, locationIds));
				if (operators) {
					const operatorsIds = operators.split(",").map(Number);
					conditions.push(inArray(fields.operator_id, operatorsIds));
				}
				if (tech) {
					const techConditions = tech
						.split(",")
						.map((t) => {
							switch (t) {
								case "cdma":
									return eq(fields.is_cdma, true);
								case "umts":
									return eq(fields.is_umts, true);
								case "gsm":
									return eq(fields.is_gsm, true);
								case "lte":
									return eq(fields.is_lte, true);
								case "5g":
									return eq(fields.is_5g, true);
								default:
									return undefined;
							}
						})
						.filter(Boolean);

					if (techConditions.length > 0) conditions.push(or(...techConditions));
				}

				return conditions.length > 0 ? and(...conditions) : undefined;
			},
			limit: limit ?? undefined,
			offset: limit ? offset : undefined,
			orderBy: (fields, operators) => [operators.asc(fields.bts_id)],
		});

		// Filter out stations with no matching cells with the specified band criteria
		const filteredStations = bandIds ? btsStations.filter((station) => station.cells.length > 0) : btsStations;

		if (!filteredStations) {
			return res.status(404).send({
				success: false,
				error: i18n.t("errors.failedToRetrieveStations", req.language),
			});
		}

		res.send({ success: true, data: filteredStations });
	},
};

export default getStations;
