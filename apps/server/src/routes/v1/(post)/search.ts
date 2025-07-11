import { eq, or, sql, ilike } from "drizzle-orm";
import { stations, cells, locations, operators } from "@openbts/drizzle";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../database/psql.js";
import { ErrorResponse } from "../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../interfaces/routes.interface.js";

type ReqBody = {
	Body: SearchParams;
};
interface SearchParams {
	query?: string;
}
const stationsSelectSchema = createSelectSchema(stations).omit({ status: true });
const cellsSelectSchema = createSelectSchema(cells);
const locationSelectSchema = createSelectSchema(locations);
const operatorsSelectSchema = createSelectSchema(operators).omit({ is_visible: true });
type StationWithCells = z.infer<typeof stationsSelectSchema> & {
	cells: z.infer<typeof cellsSelectSchema>[];
};
const schemaRoute = {
	params: z.object({}),
	body: z.object({
		query: z.string().min(1, "Query must not be empty"),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: z.array(
				stationsSelectSchema.extend({
					cells: z.array(cellsSelectSchema),
					location: locationSelectSchema,
					operator: operatorsSelectSchema,
				}),
			),
		}),
	},
};

const SIMILARITY_THRESHOLD = 0.6;

// IMPORTANT: Requires `CREATE EXTENSION pg_trgm;` command to be executed inside the target database
async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<StationWithCells[]>>) {
	const { query } = req.body;

	if (!query || query.trim() === "") throw new ErrorResponse("INVALID_QUERY");

	const stationIds = new Set<number>();
	const stationMap = new Map<number, StationWithCells>();

	const numericQuery = !Number.isNaN(Number.parseInt(query)) ? Number.parseInt(query) : null;

	if (numericQuery) {
		const stationsByBtsId = await db.query.stations.findMany({
			where: eq(stations.bts_id, numericQuery),
			with: {
				cells: true,
				location: true,
				operator: {
					columns: {
						is_visible: false,
					},
				},
			},
			columns: {
				status: false,
			},
		});

		for (const station of stationsByBtsId) {
			if (!stationIds.has(station.id)) {
				stationIds.add(station.id);
				stationMap.set(station.id, station);
			}
		}
	}

	const stationsByStationId = await db.query.stations.findMany({
		where: or(ilike(stations.station_id, `%${query}%`), sql`similarity(${stations.station_id}, ${query}) > ${SIMILARITY_THRESHOLD}`),
		with: {
			cells: true,
			location: true,
			operator: {
				columns: {
					is_visible: false,
				},
			},
		},
		columns: {
			status: false,
		},
		orderBy: sql`similarity(${stations.station_id}, ${query}) DESC`,
	});

	for (const station of stationsByStationId) {
		if (!stationIds.has(station.id)) {
			stationIds.add(station.id);
			stationMap.set(station.id, station);
		}
	}

	const matchingCells = await db.query.cells.findMany({
		where: or(
			sql`${cells.config}->>'ecid' = ${query}`,
			sql`${cells.config}->>'clid' = ${query}`,
			sql`CAST(${cells.config}->>'ecid' AS TEXT) LIKE ${`%${query}%`}`,
			sql`CAST(${cells.config}->>'clid' AS TEXT) LIKE ${`%${query}%`}`,
			sql`similarity(CAST(${cells.config}->>'ecid' AS TEXT), ${query}) > ${SIMILARITY_THRESHOLD}`,
			sql`similarity(CAST(${cells.config}->>'clid' AS TEXT), ${query}) > ${SIMILARITY_THRESHOLD}`,
		),
		with: {
			station: {
				with: {
					location: true,
					operator: {
						columns: {
							is_visible: false,
						},
					},
					cells: true,
				},
				columns: {
					status: false,
				},
			},
		},
		orderBy: [
			sql`similarity(CAST(${cells.config}->>'ecid' AS TEXT), ${query}) DESC`,
			sql`similarity(CAST(${cells.config}->>'clid' AS TEXT), ${query}) DESC`,
		],
	});

	for (const cell of matchingCells) {
		const stationId = cell.station.id;

		if (!stationIds.has(stationId)) {
			stationIds.add(stationId);
			stationMap.set(stationId, cell.station);
		}
	}

	return res.send({
		success: true,
		data: Array.from(stationMap.values()),
	});
}

const searchRoute: Route<ReqBody, StationWithCells[]> = {
	url: "/search",
	method: "POST",
	schema: schemaRoute,
	config: { permissions: ["read:stations", "read:cells"] },
	handler,
};

export default searchRoute;
