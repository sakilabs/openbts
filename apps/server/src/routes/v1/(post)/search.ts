import { eq, or, and, sql, inArray, type SQL } from "drizzle-orm";
import { stations, cells, locations, operators, gsmCells, umtsCells, lteCells, nrCells, networksIds, regions } from "@openbts/drizzle";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import db from "../../../database/psql.js";
import { ErrorResponse } from "../../../errors.js";
import { parseFilterQuery, groupFiltersByTable, hasFilters, type GroupedFilters } from "./search.filters.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../interfaces/routes.interface.js";

const stationsSelectSchema = createSelectSchema(stations).omit({ status: true });
const cellsSelectSchema = createSelectSchema(cells);
const gsmCellsSchema = createSelectSchema(gsmCells).omit({ cell_id: true });
const umtsCellsSchema = createSelectSchema(umtsCells).omit({ cell_id: true });
const lteCellsSchema = createSelectSchema(lteCells).omit({ cell_id: true });
const nrCellsSchema = createSelectSchema(nrCells).omit({ cell_id: true });
const cellDetailsSchema = z.union([gsmCellsSchema, umtsCellsSchema, lteCellsSchema, nrCellsSchema]).nullable();
const locationSelectSchema = createSelectSchema(locations).omit({ point: true });
const regionSelectSchema = createSelectSchema(regions);
const operatorsSelectSchema = createSelectSchema(operators).omit({ is_isp: true });
const networksSchema = createSelectSchema(networksIds).omit({ station_id: true });
const cellWithDetailsSchema = cellsSelectSchema.extend({ details: cellDetailsSchema });

type ReqBody = { Body: { query?: string }; Querystring: { limit?: number } };
type CellWithRat = z.infer<typeof cellsSelectSchema> & {
	gsm?: z.infer<typeof gsmCellsSchema>;
	umts?: z.infer<typeof umtsCellsSchema>;
	lte?: z.infer<typeof lteCellsSchema>;
	nr?: z.infer<typeof nrCellsSchema>;
};
type StationWithRatCells = z.infer<typeof stationsSelectSchema> & {
	cells: CellWithRat[];
	location: z.infer<typeof locationSelectSchema> | null;
	operator: z.infer<typeof operatorsSelectSchema> | null;
	networks?: z.infer<typeof networksSchema> | null;
};
type StationWithCells = z.infer<typeof stationsSelectSchema> & {
	cells: z.infer<typeof cellWithDetailsSchema>[];
	networks?: z.infer<typeof networksSchema>;
	location: z.infer<typeof locationSelectSchema> | null;
	operator: z.infer<typeof operatorsSelectSchema> | null;
};
const schemaRoute = {
	body: z.object({
		query: z.string().min(1, "Query must not be empty"),
	}),
	querystring: z.object({
		limit: z.coerce.number().int().min(1).max(100).optional().default(100),
	}),
	response: {
		200: z.object({
			data: z.array(
				stationsSelectSchema.extend({
					cells: z.array(cellWithDetailsSchema),
					location: locationSelectSchema
						.extend({
							region: regionSelectSchema,
						})
						.nullable(),
					operator: operatorsSelectSchema.nullable(),
					networks: networksSchema.optional(),
				}),
			),
		}),
	},
};

const stationQueryConfig = {
	with: {
		cells: { with: { gsm: true, umts: true, lte: true, nr: true } },
		location: { with: { region: true }, columns: { point: false } },
		operator: { columns: { is_isp: false } },
		networks: { columns: { station_id: false } },
	},
	columns: { status: false },
} as const;

const ratTables = [
	{ table: gsmCells, key: "gsmCells" as const, joinCol: gsmCells.cell_id },
	{ table: umtsCells, key: "umtsCells" as const, joinCol: umtsCells.cell_id },
	{ table: lteCells, key: "lteCells" as const, joinCol: lteCells.cell_id },
	{ table: nrCells, key: "nrCells" as const, joinCol: nrCells.cell_id },
] as const;

const numSearchCols = {
	gsm: [gsmCells.cid],
	umts: [umtsCells.cid, umtsCells.cid_long],
	lte: [lteCells.enbid, lteCells.ecid],
	nr: [nrCells.gnbid, nrCells.nci],
} as const;

const withCellDetails = (station: StationWithRatCells): StationWithCells => {
	const transformedCells = station.cells.map(({ gsm, umts, lte, nr, ...rest }) => ({
		...rest,
		details: gsm ?? umts ?? lte ?? nr ?? null,
	}));
	const result = { ...station, cells: transformedCells } as StationWithCells & { networks?: unknown };
	if (!result.networks) delete result.networks;
	return result;
};

const combineConditions = (conditions: SQL[]): SQL | undefined =>
	conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : and(...conditions);

const queryRatTableStationIds = async (grouped: GroupedFilters): Promise<number[]> => {
	const queries = ratTables
		.filter(({ key }) => grouped[key].length > 0)
		.map(({ table, key, joinCol }) =>
			db
				.select({ stationId: cells.station_id })
				.from(table)
				.innerJoin(cells, eq(joinCol, cells.id))
				.where(and(...grouped[key])),
		);

	if (queries.length === 0) return [];

	const results = await Promise.all(queries);
	return [...new Set(results.flat().map((r) => r.stationId))];
};

const buildNumericSearchCondition = (columns: readonly unknown[], numericQuery: number, likeQuery: string) =>
	or(...columns.flatMap((col) => [sql`${col} = ${numericQuery}`, sql`CAST(${col} AS TEXT) LIKE ${likeQuery}`]));

const searchNumericInRatTables = async (numericQuery: number, likeQuery: string): Promise<number[]> => {
	const [gsmMatches, umtsMatches, lteMatches, nrMatches] = await Promise.all([
		db
			.select({ stationId: cells.station_id })
			.from(gsmCells)
			.innerJoin(cells, eq(gsmCells.cell_id, cells.id))
			.where(buildNumericSearchCondition(numSearchCols.gsm, numericQuery, likeQuery)),
		db
			.select({ stationId: cells.station_id })
			.from(umtsCells)
			.innerJoin(cells, eq(umtsCells.cell_id, cells.id))
			.where(buildNumericSearchCondition(numSearchCols.umts, numericQuery, likeQuery)),
		db
			.select({ stationId: cells.station_id })
			.from(lteCells)
			.innerJoin(cells, eq(lteCells.cell_id, cells.id))
			.where(buildNumericSearchCondition(numSearchCols.lte, numericQuery, likeQuery)),
		db
			.select({ stationId: cells.station_id })
			.from(nrCells)
			.innerJoin(cells, eq(nrCells.cell_id, cells.id))
			.where(buildNumericSearchCondition(numSearchCols.nr, numericQuery, likeQuery)),
	]);

	return [...gsmMatches, ...umtsMatches, ...lteMatches, ...nrMatches].map((r) => r.stationId);
};

const fetchStations = (where?: SQL, limit?: number) => db.query.stations.findMany({ where, ...stationQueryConfig, ...(limit && { limit }) });

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<StationWithCells[]>>) {
	const { query } = req.body;
	const { limit: requestedLimit } = req.query;
	if (!query?.trim()) throw new ErrorResponse("INVALID_QUERY");

	const limit = Math.min(Math.max(requestedLimit ?? 100, 1), 100);
	const { filters, remainingQuery } = parseFilterQuery(query);

	if (hasFilters(filters)) {
		const grouped = groupFiltersByTable(filters);
		const stationConditions: SQL[] = [...grouped.stations];

		const hasRatFilters = ratTables.some(({ key }) => grouped[key].length > 0);
		const ratStationIds = await queryRatTableStationIds(grouped);

		if (hasRatFilters && ratStationIds.length === 0) return res.send({ data: [] });
		if (ratStationIds.length > 0) stationConditions.push(inArray(stations.id, ratStationIds));

		if (grouped.cells.length > 0) {
			const cellStationIds = await db.selectDistinct({ stationId: cells.station_id }).from(cells).where(combineConditions(grouped.cells));

			if (cellStationIds.length === 0) return res.send({ data: [] });
			stationConditions.push(
				inArray(
					stations.id,
					cellStationIds.map((r) => r.stationId),
				),
			);
		}

		const filteredStations = await fetchStations(combineConditions(stationConditions), limit);
		return res.send({ data: filteredStations.map(withCellDetails) });
	}

	const searchQuery = remainingQuery || query;
	const upperQuery = searchQuery.toUpperCase();
	const stationMap = new Map<number, StationWithCells>();

	const exactMatch = await fetchStations(eq(stations.station_id, upperQuery));
	if (exactMatch.length > 0) return res.send({ data: exactMatch.map(withCellDetails) });

	const fuzzyStations = await db.query.stations.findMany({
		where: sql`${stations.station_id} % ${searchQuery} OR ${stations.station_id} ILIKE ${`%${searchQuery}%`}`,
		...stationQueryConfig,
		orderBy: sql`similarity(${stations.station_id}, ${searchQuery}) DESC`,
		limit,
	});

	for (const station of fuzzyStations) {
		stationMap.set(station.id, withCellDetails(station));
	}

	const numericQuery = Number.parseInt(searchQuery, 10);
	if (/^\d+$/.test(searchQuery) && !Number.isNaN(numericQuery) && stationMap.size < limit) {
		const matchedIds = await searchNumericInRatTables(numericQuery, `%${searchQuery}%`);
		const missingIds = matchedIds.filter((id) => !stationMap.has(id)).slice(0, limit - stationMap.size);

		if (missingIds.length > 0) {
			const additionalStations = await fetchStations(inArray(stations.id, missingIds), limit - stationMap.size);
			for (const station of additionalStations) {
				stationMap.set(station.id, withCellDetails(station));
			}
		}
	}

	return res.send({ data: Array.from(stationMap.values()).slice(0, limit) });
}

const searchRoute: Route<ReqBody, StationWithCells[]> = {
	url: "/search",
	method: "POST",
	schema: schemaRoute,
	config: { permissions: ["read:stations", "read:cells"], allowGuestAccess: true },
	handler,
};

export default searchRoute;
