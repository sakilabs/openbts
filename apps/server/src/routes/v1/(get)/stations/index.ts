import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import { stations } from "@openbts/drizzle";

type ReqQuery = {
	Querystring: StationFilterParams;
};

interface StationFilterParams {
	bounds?: string;
	limit?: number;
	page?: number;
	tech?: string;
	operators?: string;
	bands?: string;
}

type Station = typeof stations.$inferSelect;
const stationsSchema = createSelectSchema(stations);
const schemaRoute = {
	querystring: z.object({
		bounds: z
			.string()
			.regex(/^-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+$/)
			.optional(),
		limit: z.number().min(1).optional(),
		page: z.number().min(1).default(1),
		tech: z
			.string()
			.regex(/^(?:cdma|umts|gsm|lte|5g)(?:,(?:cdma|umts|gsm|lte|5g))*$/i)
			.optional(),
		operators: z
			.string()
			.regex(/^\d+(,\d+)*$/)
			.optional(),
		bands: z
			.string()
			.regex(/^\d+(,\d+)*$/)
			.optional(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: z.array(stationsSchema),
		}),
	},
};

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<Station[]>>) {
	const { limit, page = 1, bounds, tech, operators, bands } = req.query;
	const offset = limit ? (page - 1) * limit : undefined;

	let locationIds: number[] | undefined;

	if (bounds) {
		const coords = bounds.split(",").map(Number);
		const [lat1, lon1, lat2, lon2] = coords;
		if (!lat1 || !lon1 || !lat2 || !lon2) throw new ErrorResponse("BAD_REQUEST");

		const [north, south] = lat1 > lat2 ? [lat1, lat2] : [lat2, lat1];
		const [east, west] = lon1 > lon2 ? [lon1, lon2] : [lon2, lon1];

		const boundaryLocations = await db.query.locations.findMany({
			columns: { id: true },
			where: (fields, { and, lte, gte }) =>
				and(lte(fields.latitude, north), gte(fields.latitude, south), lte(fields.longitude, east), gte(fields.longitude, west)),
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

	try {
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
			offset,
			orderBy: (fields, operators) => [operators.asc(fields.bts_id)],
		});

		const filteredStations = tech
			? btsStations.filter((station) => {
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
				})
			: btsStations;

		res.send({ success: true, data: filteredStations });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const getStations: Route<ReqQuery, Station[]> = {
	url: "/stations",
	method: "GET",
	schema: schemaRoute,
	config: { permissions: ["read:stations"] },
	handler,
};

export default getStations;
