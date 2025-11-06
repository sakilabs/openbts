import { createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";
import { locations, stations, cells, bands, operators, regions, networksIds } from "@openbts/drizzle";

const stationsSchema = createSelectSchema(stations).omit({ status: true });
const cellsSchema = createSelectSchema(cells).omit({ band_id: true, station_id: true });
const bandsSchema = createSelectSchema(bands);
const regionSchema = createSelectSchema(regions);
const locationSchema = createSelectSchema(locations).omit({ point: true, region_id: true });
const operatorSchema = createSelectSchema(operators).omit({ is_isp: true });
const networksSchema = createSelectSchema(networksIds).omit({ station_id: true });
const cellResponseSchema = cellsSchema.extend({ band: bandsSchema });
const stationResponseSchema = stationsSchema.extend({
	cells: z.array(cellResponseSchema),
	location: locationSchema.extend({ region: regionSchema }),
	operator: operatorSchema,
	networks: networksSchema.optional(),
});
type Station = z.infer<typeof stationResponseSchema>;
type CellWithBand = z.infer<typeof cellsSchema> & { band: z.infer<typeof bandsSchema> };
type StationRaw = z.infer<typeof stationsSchema> & { cells: CellWithBand[]; networks?: z.infer<typeof networksSchema> | null };
const schemaRoute = {
	querystring: z.object({
		bounds: z
			.string()
			.regex(/^-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+$/)
			.optional()
			.transform((val): number[] | undefined => (val ? val.split(",").map(Number) : undefined)),
		limit: z.coerce.number().min(1).max(1000).optional().default(150),
		page: z.coerce.number().min(1).default(1),
		rat: z
			.string()
			.regex(/^(?:cdma|umts|gsm|lte|5g|iot)(?:,(?:cdma|umts|gsm|lte|5g|iot))*$/i)
			.optional()
			.transform((val): string[] | undefined => (val ? val.toLowerCase().split(",").filter(Boolean) : undefined)),
		operators: z
			.string()
			.regex(/^\d+(,\d+)*$/)
			.optional()
			.transform((val): number[] | undefined =>
				val
					? val
							.split(",")
							.map(Number)
							.filter((n) => !Number.isNaN(n))
					: undefined,
			),
		bands: z
			.string()
			.regex(/^\d+(,\d+)*$/)
			.optional()
			.transform((val): number[] | undefined =>
				val
					? val
							.split(",")
							.map(Number)
							.filter((n) => !Number.isNaN(n))
					: undefined,
			),
	}),
	response: {
		200: z.object({
			data: z.array(stationResponseSchema),
		}),
	},
};

type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<Station[]>>) {
	const { limit = undefined, page = 1, bounds, rat, operators: operatorMncs, bands: bandValues } = req.query;
	const offset = limit ? (page - 1) * limit : undefined;

	let envelope: ReturnType<typeof sql> | undefined;
	if (bounds) {
		const [la1, lo1, la2, lo2] = bounds as [number, number, number, number];
		const [west, south] = [Math.min(lo1, lo2), Math.min(la1, la2)];
		const [east, north] = [Math.max(lo1, lo2), Math.max(la1, la2)];
		envelope = sql`ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)`;
	}

	let bandIds: number[] | undefined;
	if (bandValues) {
		const validBands = await db.query.bands.findMany({
			columns: { id: true },
			where: (fields, { inArray }) => inArray(fields.value, bandValues),
		});

		bandIds = validBands.map((band) => band.id);
		if (!bandIds.length) return res.send({ data: [] });
	}

	const operatorRows = operatorMncs?.length
		? await db.query.operators.findMany({
				columns: { id: true },
				where: (f, { inArray }) => inArray(f.mnc, operatorMncs),
			})
		: [];

	const operatorIds = operatorRows.map((r) => r.id);

	const requestedRats = rat ?? [];
	type NonIotRat = "GSM" | "UMTS" | "LTE" | "NR";
	const ratMap: Record<string, NonIotRat> = { gsm: "GSM", umts: "UMTS", lte: "LTE", "5g": "NR" } as const;
	const nonIotRats: NonIotRat[] = requestedRats.map((r) => ratMap[r]).filter((r): r is NonIotRat => r !== undefined);
	const iotRequested = requestedRats.includes("iot");

	try {
		const btsStations = await db.query.stations.findMany({
			where: (fields, { and, inArray }) => {
				const conditions = [];
				if (operatorIds.length) conditions.push(inArray(fields.operator_id, operatorIds));
				if (envelope)
					conditions.push(sql`EXISTS (SELECT 1 FROM locations l WHERE l.id = ${stations.location_id} AND ST_Intersects(l.point, ${envelope}))`);

				if ((bandIds?.length ?? 0) || nonIotRats.length || iotRequested) {
					const bandCond = bandIds?.length
						? sql` AND c.band_id = ANY(ARRAY[${sql.join(
								bandIds.map((id) => sql`${id}`),
								sql`,`,
							)}]::int4[])`
						: sql``;
					const ratCond = nonIotRats.length
						? sql` AND c.rat IN (${sql.join(
								nonIotRats.map((r) => sql`${r}`),
								sql`,`,
							)})`
						: sql``;
					const iotCond = iotRequested
						? sql` AND (
								EXISTS (SELECT 1 FROM lte_cells lc WHERE lc.cell_id = c.id AND lc.supports_nb_iot = true)
								OR EXISTS (SELECT 1 FROM nr_cells nc WHERE nc.cell_id = c.id AND nc.supports_nr_redcap = true)
							)`
						: sql``;

					conditions.push(sql`
						EXISTS (
							SELECT 1
							FROM cells c
							WHERE c.station_id = ${stations.id}
							${bandCond}
							${ratCond}
							${iotCond}
						)
					`);
				}

				return conditions.length ? and(...conditions) : undefined;
			},
			columns: {
				status: false,
			},
			with: {
				cells: {
					columns: { band_id: false },
					with: { band: true },
					where: (fields, { and, inArray, or, eq }) => {
						const cellConds = [];
						if (bandIds) cellConds.push(inArray(fields.band_id, bandIds));
						if (nonIotRats.length) cellConds.push(or(...nonIotRats.map((r) => eq(fields.rat, r))));
						if (iotRequested) {
							cellConds.push(
								sql`(EXISTS (SELECT 1 FROM lte_cells lc WHERE lc.cell_id = ${fields.id} AND lc.supports_nb_iot = true)
								     OR EXISTS (SELECT 1 FROM nr_cells nc WHERE nc.cell_id = ${fields.id} AND nc.supports_nr_redcap = true))`,
							);
						}
						return cellConds.length ? and(...cellConds) : undefined;
					},
				},
				location: { columns: { point: false, region_id: false }, with: { region: true } },
				operator: { columns: { is_isp: false } },
				networks: { columns: { station_id: false } },
			},
			limit,
			offset,
			orderBy: (fields, operators) => [operators.asc(fields.id)],
		});

		const mappedStations: Station[] = btsStations.map((station: StationRaw) => {
			const cellsWithoutDetails = station.cells.map((cell) => {
				const { band, ...rest } = cell;
				return { ...rest, band };
			});

			const stationWithNetworks = { ...station, cells: cellsWithoutDetails } as Station & { networks?: z.infer<typeof networksSchema> | null };
			if (!stationWithNetworks.networks) delete (stationWithNetworks as { networks?: unknown }).networks;
			return stationWithNetworks as Station;
		});

		return res.send({ data: mappedStations });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("INTERNAL_SERVER_ERROR", { cause: error });
	}
}

const getStations: Route<ReqQuery, Station[]> = {
	url: "/stations",
	method: "GET",
	schema: schemaRoute,
	config: { permissions: ["read:stations"], allowGuestAccess: true },
	handler,
};

export default getStations;
