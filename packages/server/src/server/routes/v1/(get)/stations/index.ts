import db from "../../../../database/index.js";
import { i18n } from "../../../../i18n/index.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import type { stations } from "@openbts/drizzle";

interface StationFilterParams {
	bounds?: string;
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
						// TODO: Add station schema
						properties: {},
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
	config: { permissions: ["read:stations"] },
	handler: async (req: FastifyRequest<{ Querystring: StationFilterParams }>, res: ReplyPayload<JSONBody<typeof stations>>) => {
		const { limit, page = 1, bounds, tech, operators, bands } = req.query;
		const offset = (page - 1) * (limit ?? 0);

		let locationIds: number[] | undefined;

		if (bounds) {
			const coords = bounds.split(",").map(Number);
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

		const btsStations = await db.query.stations.findMany({
			with: {
				cells: {
					with: {
						band: true,
					},
					where: (fields, { inArray }) => (bandIds ? inArray(fields.band_id, bandIds) : undefined),
				},
			},
			where: (fields, { and, inArray }) => {
				const conditions = [];
				if (locationIds) conditions.push(inArray(fields.location_id, locationIds));
				if (operatorIds) conditions.push(inArray(fields.operator_id, operatorIds));

				return conditions.length > 0 ? and(...conditions) : undefined;
			},
			limit: limit ?? undefined,
			offset: limit ? offset : undefined,
			orderBy: (fields, operators) => [operators.asc(fields.bts_id)],
		});

		const filteredStations = btsStations.filter((station) => {
			if (!tech) return true;
			const requestedTechs = tech.toLowerCase().split(",");
			if (requestedTechs.includes("cdma") && station.is_cdma) return true;

			return station.cells.some((cell) => {
				const bandName = cell.band.name.toLowerCase();
				return requestedTechs.some((tech) => {
					switch (tech) {
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
		});

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
