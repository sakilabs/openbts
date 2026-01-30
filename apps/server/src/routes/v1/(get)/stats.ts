import { sql } from "drizzle-orm";
import { z } from "zod/v4";
import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../interfaces/routes.interface.js";
import db from "../../../database/psql.js";
import { ukeImportMetadata, stations, cells, ukePermits, ukeLocations, locations } from "@openbts/drizzle";

type ImportTimestamp = {
	import_type: string;
	last_import_date: Date;
};

type Response = {
	lastUpdated: {
		stations: string | null;
		stations_permits: string | null;
		radiolines: string | null;
	};
	counts: {
		locations: number;
		stations: number;
		cells: number;
		uke_locations: number;
		uke_permits: number;
	};
};

const schemaRoute = {
	response: {
		200: z.object({
			data: z.object({
				lastUpdated: z.object({
					stations: z.string().nullable(),
					stations_permits: z.string().nullable(),
					radiolines: z.string().nullable(),
				}),
				counts: z.object({
					locations: z.number(),
					stations: z.number(),
					cells: z.number(),
					uke_locations: z.number(),
					uke_permits: z.number(),
				}),
			}),
		}),
	},
};

async function handler(_: FastifyRequest, res: ReplyPayload<JSONBody<Response>>) {
	// Get the latest successful import for each type
	const importTimestamps = await db
		.selectDistinctOn([ukeImportMetadata.import_type], {
			import_type: ukeImportMetadata.import_type,
			last_import_date: ukeImportMetadata.last_import_date,
		})
		.from(ukeImportMetadata)
		.where(sql`${ukeImportMetadata.status} = 'success'`)
		.orderBy(ukeImportMetadata.import_type, sql`${ukeImportMetadata.last_import_date} DESC`);

	// Build the lastUpdated object
	const lastUpdated: Response["lastUpdated"] = {
		stations: null,
		stations_permits: null,
		radiolines: null,
	};

	for (const row of importTimestamps as ImportTimestamp[]) {
		if (row.import_type === "stations") {
			lastUpdated.stations = row.last_import_date.toISOString();
		} else if (row.import_type === "stations_permits") {
			lastUpdated.stations_permits = row.last_import_date.toISOString();
		} else if (row.import_type === "radiolines") {
			lastUpdated.radiolines = row.last_import_date.toISOString();
		}
	}

	// Get counts
	const [countsResult] = await db
		.select({
			locations: sql<number>`(SELECT COUNT(*)::int FROM ${locations})`,
			stations: sql<number>`(SELECT COUNT(*)::int FROM ${stations})`,
			cells: sql<number>`(SELECT COUNT(*)::int FROM ${cells})`,
			uke_locations: sql<number>`(SELECT COUNT(*)::int FROM ${ukeLocations})`,
			uke_permits: sql<number>`(SELECT COUNT(*)::int FROM ${ukePermits})`,
		})
		.from(sql`(SELECT 1) AS dummy`);

	res.send({
		data: {
			lastUpdated,
			counts: {
				locations: countsResult?.locations ?? 0,
				stations: countsResult?.stations ?? 0,
				cells: countsResult?.cells ?? 0,
				uke_locations: countsResult?.uke_locations ?? 0,
				uke_permits: countsResult?.uke_permits ?? 0,
			},
		},
	});
}

const getStats: Route<never, Response> = {
	url: "/stats",
	method: "GET",
	schema: schemaRoute,
	config: { permissions: ["read:stats"], allowGuestAccess: true },
	handler,
};

export default getStats;
