import { createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import { locations, stations, cells, bands, gsmCells, umtsCells, lteCells, nrCells } from "@openbts/drizzle";

type ReqQuery = {
	Querystring: StationFilterParams;
};

interface StationFilterParams {
	bounds?: string;
	limit?: number;
	page?: number;
	rat?: string;
	operators?: string;
	bands?: string;
}

const stationsSchema = createSelectSchema(stations).omit({ status: true });
const cellsSchema = createSelectSchema(cells).omit({ band_id: true });
const bandsSchema = createSelectSchema(bands);
const gsmCellsSchema = createSelectSchema(gsmCells).omit({ cell_id: true });
const umtsCellsSchema = createSelectSchema(umtsCells).omit({ cell_id: true });
const lteCellsSchema = createSelectSchema(lteCells).omit({ cell_id: true });
const nrCellsSchema = createSelectSchema(nrCells).omit({ cell_id: true });
const cellDetailsSchema = z.union([gsmCellsSchema, umtsCellsSchema, lteCellsSchema, nrCellsSchema]).nullable();
const cellResponseSchema = cellsSchema.extend({ band: bandsSchema, details: cellDetailsSchema });
const stationResponseSchema = stationsSchema.extend({ cells: z.array(cellResponseSchema) });
type Station = z.infer<typeof stationResponseSchema>;
type CellWithRats = z.infer<typeof cellsSchema> & {
	band: z.infer<typeof bandsSchema>;
	gsm?: z.infer<typeof gsmCellsSchema>;
	umts?: z.infer<typeof umtsCellsSchema>;
	lte?: z.infer<typeof lteCellsSchema>;
	nr?: z.infer<typeof nrCellsSchema>;
};
type StationRaw = z.infer<typeof stationsSchema> & { cells: CellWithRats[] };
const schemaRoute = {
	querystring: z.object({
		bounds: z
			.string()
			.regex(/^-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+$/)
			.optional(),
		limit: z.number().min(1).optional(),
		page: z.number().min(1).default(1),
		rat: z
			.string()
			.regex(/^(?:cdma|umts|gsm|lte|5g|iot)(?:,(?:cdma|umts|gsm|lte|5g|iot))*$/i)
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
			data: z.array(stationResponseSchema),
		}),
	},
};

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<Station[]>>) {
	const { limit = undefined, page = 1, bounds, rat, operators, bands } = req.query;
	const offset = limit ? (page - 1) * limit : undefined;

	let locationIds: number[] | undefined;

	if (bounds) {
		const splitBounds = bounds.split(",").map(Number);
		if (splitBounds.length !== 4 || splitBounds.some(Number.isNaN)) throw new ErrorResponse("BAD_REQUEST");
		const [la1, lo1, la2, lo2] = splitBounds as [number, number, number, number];
		const [west, south] = [Math.min(lo1, lo2), Math.min(la1, la2)];
		const [east, north] = [Math.max(lo1, lo2), Math.max(la1, la2)];

		const boundaryLocations = await db
			.select({ id: locations.id })
			.from(locations)
			.where(sql`ST_Intersects(${locations.point}, ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326))`);

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
		// biome-ignore lint/suspicious/useIterableCallbackReturn: nah
		const operatorQueries = operators.split(",").map((op) => {
			const mnc = Number.parseInt(op, 10);
			if (!Number.isNaN(mnc)) {
				return db.query.operators.findMany({
					columns: { id: true },
					where: (fields, { eq }) => eq(fields.mnc, mnc),
				});
			}
		});

		const operatorResults = await Promise.all(operatorQueries);
		const flattenedResults = operatorResults.flat().filter((op): op is NonNullable<typeof op> => op !== undefined);
		operatorIds = flattenedResults.map((op) => op.id);
		if (!operatorIds.length) return res.send({ success: true, data: [] });
	}

	const requestedRats = rat ? rat.toLowerCase().split(",").filter(Boolean) : [];
	type NonIotRat = "GSM" | "UMTS" | "LTE" | "NR";
	const ratMap: Record<string, NonIotRat> = { gsm: "GSM", umts: "UMTS", lte: "LTE", "5g": "NR" } as const;
	const nonIotRats: NonIotRat[] = requestedRats.map((r) => ratMap[r]).filter((r): r is NonIotRat => r !== undefined);
	const iotRequested = requestedRats.includes("iot");

	try {
		const btsStations = await db.query.stations.findMany({
			with: {
				cells: {
					columns: {
						band_id: false,
					},
					with: {
						band: true,
						gsm: true,
						umts: true,
						lte: true,
						nr: true,
					},
					where: (fields, { and, inArray, or, eq }) => {
						if (bandIds && nonIotRats.length) return and(inArray(fields.band_id, bandIds), or(...nonIotRats.map((r) => eq(fields.rat, r))));
						if (bandIds) return inArray(fields.band_id, bandIds);
						if (nonIotRats.length) return or(...nonIotRats.map((r) => eq(fields.rat, r)));
						return undefined;
					},
				},
			},
			columns: {
				status: false,
			},
			where: (fields, { and, inArray }) => {
				const conditions = [];
				if (locationIds) conditions.push(inArray(fields.location_id, locationIds));
				if (operatorIds) conditions.push(inArray(fields.operator_id, operatorIds));

				return conditions.length > 0 ? and(...conditions) : undefined;
			},
			limit,
			offset,
			orderBy: (fields, operators) => [operators.asc(fields.id)],
		});

		const mappedStations: Station[] = btsStations.map((station: StationRaw) => {
			const cellsWithDetails = station.cells.map((cell: CellWithRats) => {
				const { gsm, umts, lte, nr, band, ...rest } = cell;
				return { ...rest, band, details: gsm ?? umts ?? lte ?? nr ?? null };
			});

			return { ...station, cells: cellsWithDetails } as Station;
		});

		const hasNbIot = (d: z.infer<typeof cellDetailsSchema>): d is z.infer<typeof lteCellsSchema> =>
			Boolean(d && typeof d === "object" && "supports_nb_iot" in d);
		const hasNrRedcap = (d: z.infer<typeof cellDetailsSchema>): d is z.infer<typeof nrCellsSchema> =>
			Boolean(d && typeof d === "object" && "supports_nr_redcap" in d);

		const finalStations: Station[] = mappedStations.map((station) => {
			if (!iotRequested && !nonIotRats.length) return station;
			const nextCells = station.cells.filter((cell) => {
				const matchesNonIot = nonIotRats.length ? nonIotRats.includes(cell.rat as NonIotRat) : true;
				const iotCapable =
					(cell.rat === "LTE" && hasNbIot(cell.details) && cell?.details?.supports_nb_iot) ||
					(cell.rat === "NR" && hasNrRedcap(cell.details) && cell?.details?.supports_nr_redcap);
				if (iotRequested && !nonIotRats.length) return iotCapable;
				if (iotRequested && nonIotRats.length) return matchesNonIot || iotCapable;
				return matchesNonIot;
			});
			return { ...station, cells: nextCells } as Station;
		});

		const filteredStations = rat ? finalStations.filter((station) => station.cells.length > 0) : finalStations;

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
