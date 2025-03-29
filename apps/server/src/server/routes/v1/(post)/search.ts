import db from "../../../database/psql.js";
import { eq, or, sql, ilike } from "drizzle-orm";
import { stations, cells } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../interfaces/routes.interface.js";

type ReqBody = {
	Body: SearchParams;
};
interface SearchParams {
	query?: string;
}
type StationWithCells = typeof stations.$inferSelect & {
	cells: (typeof cells.$inferSelect)[];
};

const schemaRoute = {
	body: {
		type: "object",
		properties: {
			query: {
				type: "string",
			},
		},
	},
};

const SIMILARITY_THRESHOLD = 0.6;

// IMPORTANT: REQUIRES `CREATE EXTENSION pg_trgm;` TO BE EXECUTED IN DATABASE.
async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<StationWithCells[]>>) {
	const { query } = req.body;

	if (!query || query.trim() === "") {
		return res.status(400).send({
			success: false,
			error: "Search query is required",
		});
	}

	const stationIds = new Set<number>();
	const stationMap = new Map<number, StationWithCells>();

	const numericQuery = !Number.isNaN(Number.parseInt(query)) ? Number.parseInt(query) : null;

	if (numericQuery) {
		const stationsByBtsId = await db.query.stations.findMany({
			where: eq(stations.bts_id, numericQuery),
			with: {
				cells: true,
				location: true,
				operator: true,
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
			operator: true,
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
					operator: true,
					cells: true,
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

	// I mean do we really need to match operators in search? Idk. It's here to be enabled if needed.
	// const carrierMatchingCells = await db.query.cells.findMany({
	// 	where: or(
	// 		sql`CAST(${cells.config}->>'carrier' AS TEXT) = ${query}`,
	// 		sql`CAST(${cells.config}->>'carrier' AS TEXT) LIKE ${`%${query}%`}`,
	// 		sql`similarity(CAST(${cells.config}->>'carrier' AS TEXT), ${query}) > ${SIMILARITY_THRESHOLD}`,
	// 	),
	// 	with: {
	// 		station: {
	// 			with: {
	// 				location: true,
	// 				operator: true,
	// 				cells: true,
	// 			},
	// 		},
	// 	},
	// });

	// for (const cell of carrierMatchingCells) {
	// 	const stationId = cell.station.id;

	// 	if (!stationIds.has(stationId)) {
	// 		stationIds.add(stationId);
	// 		stationMap.set(stationId, cell.station);
	// 	}
	// }

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
