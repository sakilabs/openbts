import { eq, or, sql, ilike, inArray } from "drizzle-orm";
import { stations, cells, locations, operators, gsmCells, umtsCells, lteCells, nrCells, networksIds } from "@openbts/drizzle";
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
const gsmCellsSchema = createSelectSchema(gsmCells).omit({ cell_id: true });
const umtsCellsSchema = createSelectSchema(umtsCells).omit({ cell_id: true });
const lteCellsSchema = createSelectSchema(lteCells).omit({ cell_id: true });
const nrCellsSchema = createSelectSchema(nrCells).omit({ cell_id: true });
const cellDetailsSchema = z.union([gsmCellsSchema, umtsCellsSchema, lteCellsSchema, nrCellsSchema]).nullable();
const locationSelectSchema = createSelectSchema(locations).omit({ point: true });
const operatorsSelectSchema = createSelectSchema(operators).omit({ is_isp: true });
const networksSchema = createSelectSchema(networksIds).omit({ station_id: true });
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
const cellWithDetailsSchema = cellsSelectSchema.extend({
	details: cellDetailsSchema,
});
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
	response: {
		200: z.object({
			success: z.boolean(),
			data: z.array(
				stationsSelectSchema.extend({
					cells: z.array(cellWithDetailsSchema),
					location: locationSelectSchema.nullable(),
					operator: operatorsSelectSchema.nullable(),
					networks: networksSchema.optional(),
				}),
			),
		}),
	},
};

const SIMILARITY_THRESHOLD = 0.7;

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<StationWithCells[]>>) {
	const { query } = req.body;
	if (!query || query.trim() === "") throw new ErrorResponse("INVALID_QUERY");

	const stationIds = new Set<number>();
	const stationMap = new Map<number, StationWithCells>();

	const withCellDetails = (station: StationWithRatCells): StationWithCells => {
		const cells = station.cells.map((c: CellWithRat) => {
			const { gsm, umts, lte, nr, ...rest } = c;
			return { ...rest, details: gsm ?? umts ?? lte ?? nr ?? null };
		});
		const result = { ...station, cells } as StationWithCells & { networks?: z.infer<typeof networksSchema> | null };
		if (!result.networks) delete (result as { networks?: unknown }).networks;
		return result;
	};

	const numericQuery = !Number.isNaN(Number.parseInt(query, 10)) ? Number.parseInt(query, 10) : null;

	const stationsByStationId = await db.query.stations.findMany({
		where: or(ilike(stations.station_id, `%${query}%`), sql`similarity(${stations.station_id}, ${query}) > ${SIMILARITY_THRESHOLD}`),
		with: {
			cells: {
				with: {
					gsm: true,
					umts: true,
					lte: true,
					nr: true,
				},
			},
			location: { columns: { point: false } },
			operator: { columns: { is_isp: false } },
			networks: { columns: { station_id: false } },
		},
		columns: {
			status: false,
		},
		orderBy: sql`similarity(${stations.station_id}, ${query}) DESC`,
	});

	for (const station of stationsByStationId) {
		if (!stationIds.has(station.id)) {
			stationIds.add(station.id);
			stationMap.set(station.id, withCellDetails(station));
		}
	}

	const likeQuery = `%${query}%`;
	if (/^\d+$/.test(query)) {
		const [gsmMatches, umtsMatches, lteMatches, nrMatches] = await Promise.all([
			db
				.select({ stationId: cells.station_id })
				.from(gsmCells)
				.innerJoin(cells, eq(gsmCells.cell_id, cells.id))
				.where(sql`${gsmCells.cid} = ${numericQuery}`),

			db
				.select({ stationId: cells.station_id })
				.from(umtsCells)
				.innerJoin(cells, eq(umtsCells.cell_id, cells.id))
				.where(or(sql`${umtsCells.cid} = ${numericQuery}`, sql`${umtsCells.cid_long} = ${numericQuery}`)),

			db
				.select({ stationId: cells.station_id })
				.from(lteCells)
				.innerJoin(cells, eq(lteCells.cell_id, cells.id))
				.where(or(sql`${lteCells.enbid} = ${numericQuery}`, sql`${lteCells.ecid} = ${numericQuery}`)),

			db
				.select({ stationId: cells.station_id })
				.from(nrCells)
				.innerJoin(cells, eq(nrCells.cell_id, cells.id))
				.where(or(sql`${nrCells.gnbid} = ${numericQuery}`, sql`${nrCells.nci} = ${numericQuery}`)),
		]);

		for (const row of [...gsmMatches, ...umtsMatches, ...lteMatches, ...nrMatches]) {
			const sId = row.stationId;
			if (!stationIds.has(sId)) stationIds.add(sId);
		}
	} else {
		const [gsmMatches, umtsMatches, lteMatches, nrMatches] = await Promise.all([
			db
				.select({ stationId: cells.station_id })
				.from(gsmCells)
				.innerJoin(cells, eq(gsmCells.cell_id, cells.id))
				.where(
					or(
						sql`CAST(${gsmCells.cid} AS TEXT) ILIKE ${likeQuery}`,
						sql`similarity(CAST(${gsmCells.cid} AS TEXT), ${query}) > ${SIMILARITY_THRESHOLD}`,
					),
				),

			db
				.select({ stationId: cells.station_id })
				.from(umtsCells)
				.innerJoin(cells, eq(umtsCells.cell_id, cells.id))
				.where(
					or(
						sql`CAST(${umtsCells.cid} AS TEXT) ILIKE ${likeQuery}`,
						sql`CAST(${umtsCells.cid_long} AS TEXT) ILIKE ${likeQuery}`,
						sql`similarity(CAST(${umtsCells.cid} AS TEXT), ${query}) > ${SIMILARITY_THRESHOLD}`,
						sql`similarity(CAST(${umtsCells.cid_long} AS TEXT), ${query}) > ${SIMILARITY_THRESHOLD}`,
					),
				),

			db
				.select({ stationId: cells.station_id })
				.from(lteCells)
				.innerJoin(cells, eq(lteCells.cell_id, cells.id))
				.where(
					or(
						sql`CAST(${lteCells.enbid} AS TEXT) ILIKE ${likeQuery}`,
						sql`CAST(${lteCells.ecid} AS TEXT) ILIKE ${likeQuery}`,
						sql`similarity(CAST(${lteCells.enbid} AS TEXT), ${query}) > ${SIMILARITY_THRESHOLD}`,
						sql`similarity(CAST(${lteCells.ecid} AS TEXT), ${query}) > ${SIMILARITY_THRESHOLD}`,
					),
				),

			db
				.select({ stationId: cells.station_id })
				.from(nrCells)
				.innerJoin(cells, eq(nrCells.cell_id, cells.id))
				.where(
					or(
						sql`CAST(${nrCells.gnbid} AS TEXT) ILIKE ${likeQuery}`,
						sql`CAST(${nrCells.nci} AS TEXT) ILIKE ${likeQuery}`,
						sql`similarity(CAST(${nrCells.gnbid} AS TEXT), ${query}) > ${SIMILARITY_THRESHOLD}`,
						sql`similarity(CAST(${nrCells.nci} AS TEXT), ${query}) > ${SIMILARITY_THRESHOLD}`,
					),
				),
		]);

		for (const row of [...gsmMatches, ...umtsMatches, ...lteMatches, ...nrMatches]) {
			const sId = row.stationId;
			if (!stationIds.has(sId)) stationIds.add(sId);
		}
	}

	const missingStationIds = Array.from(stationIds).filter((id) => !stationMap.has(id));
	if (missingStationIds.length > 0) {
		const stationsByCells = await db.query.stations.findMany({
			where: inArray(stations.id, missingStationIds),
			with: {
				cells: {
					with: {
						gsm: true,
						umts: true,
						lte: true,
						nr: true,
					},
				},
				location: { columns: { point: false } },
				operator: {
					columns: {
						is_isp: false,
					},
				},
				networks: { columns: { station_id: false } },
			},
			columns: {
				status: false,
			},
		});

		for (const station of stationsByCells) {
			if (!stationMap.has(station.id)) stationMap.set(station.id, withCellDetails(station));
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
	config: { permissions: ["read:stations", "read:cells"], allowGuestAccess: true },
	handler,
};

export default searchRoute;
