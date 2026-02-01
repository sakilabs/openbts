import { createSelectSchema } from "drizzle-zod";
import { sql, count, and as drizzleAnd } from "drizzle-orm";
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
const operatorSchema = createSelectSchema(operators);
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
		regions: z
			.string()
			.regex(/^[A-Z]{3}(,[A-Z]{3})*$/)
			.optional()
			.transform((val): string[] | undefined => (val ? val.split(",").filter(Boolean) : undefined)),
	}),
	response: {
		200: z.object({
			data: z.array(stationResponseSchema),
			totalCount: z.number(),
		}),
	},
};

type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };
type ResponseBody = { data: Station[]; totalCount: number };

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResponseBody>>) {
	const { limit = undefined, page = 1, bounds, rat, operators: operatorMncs, bands: bandValues, regions } = req.query;
	const offset = limit ? (page - 1) * limit : undefined;

	const expandedOperatorMncs = operatorMncs?.includes(26034) ? [...new Set([...operatorMncs, 26002, 26003])] : operatorMncs;

	let envelope: ReturnType<typeof sql> | undefined;
	if (bounds) {
		const [la1, lo1, la2, lo2] = bounds as [number, number, number, number];
		const [west, south] = [Math.min(lo1, lo2), Math.min(la1, la2)];
		const [east, north] = [Math.max(lo1, lo2), Math.max(la1, la2)];
		envelope = sql`ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)`;
	}

	const [bandRows, operatorRows, regionsRows] = await Promise.all([
		bandValues?.length
			? db.query.bands.findMany({
					columns: { id: true },
					where: (fields, { inArray }) => inArray(fields.value, bandValues),
				})
			: [],
		expandedOperatorMncs?.length
			? db.query.operators.findMany({
					columns: { id: true },
					where: (f, { inArray }) => inArray(f.mnc, expandedOperatorMncs),
				})
			: [],
		regions?.length
			? db.query.regions.findMany({
					columns: { id: true },
					where: (f, { inArray }) => inArray(f.name, regions),
				})
			: [],
	]);

	const bandIds = bandRows.map((b) => b.id);
	const operatorIds = operatorRows.map((r) => r.id);
	const regionIds = regionsRows.map((r) => r.id);

	if (bandValues?.length && !bandIds.length) return res.send({ data: [], totalCount: 0 });

	const requestedRats = rat ?? [];
	type NonIotRat = "GSM" | "UMTS" | "LTE" | "NR";
	const ratMap: Record<string, NonIotRat> = { gsm: "GSM", umts: "UMTS", lte: "LTE", "5g": "NR" } as const;
	const nonIotRats: NonIotRat[] = requestedRats.map((r) => ratMap[r]).filter((r): r is NonIotRat => r !== undefined);
	const iotRequested = requestedRats.includes("iot");

	const buildStationConditions = (): ReturnType<typeof sql>[] => {
		const conditions: ReturnType<typeof sql>[] = [];

		if (operatorIds.length) {
			conditions.push(
				sql`${stations.operator_id} = ANY(ARRAY[${sql.join(
					operatorIds.map((id) => sql`${id}`),
					sql`,`,
				)}]::int4[])`,
			);
		}
		if (envelope)
			conditions.push(sql`EXISTS (SELECT 1 FROM locations l WHERE l.id = ${stations.location_id} AND ST_Intersects(l.point, ${envelope}))`);
		if (regionIds.length) {
			conditions.push(
				sql`EXISTS (SELECT 1 FROM locations l WHERE l.id = ${stations.location_id} AND l.region_id = ANY(ARRAY[${sql.join(
					regionIds.map((id) => sql`${id}`),
					sql`,`,
				)}]::int4[]))`,
			);
		}
		if (bandIds.length || nonIotRats.length || iotRequested) {
			const bandCond = bandIds.length
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

		return conditions;
	};

	const stationConditions = buildStationConditions();

	try {
		const whereClause = stationConditions.length ? drizzleAnd(...stationConditions) : undefined;

		const [countResult, btsStations] = await Promise.all([
			db.select({ count: count() }).from(stations).where(whereClause),
			db.query.stations.findMany({
				where: whereClause,
				columns: {
					status: false,
				},
				with: {
					cells: {
						columns: { band_id: false },
						with: { band: true },
					},
					location: { columns: { point: false, region_id: false }, with: { region: true } },
					operator: true,
					networks: { columns: { station_id: false } },
				},
				limit,
				offset,
				orderBy: (fields, operators) => [operators.desc(fields.id)],
			}),
		]);

		const totalCount = countResult[0]?.count ?? 0;

		const mappedStations: Station[] = btsStations.map((station: StationRaw) => {
			const cellsWithoutDetails = station.cells.map((cell) => {
				const { band, ...rest } = cell;
				return { ...rest, band };
			});

			const stationWithNetworks = { ...station, cells: cellsWithoutDetails } as Station & { networks?: z.infer<typeof networksSchema> | null };
			if (!stationWithNetworks.networks) delete (stationWithNetworks as { networks?: unknown }).networks;
			return stationWithNetworks as Station;
		});

		return res.send({ data: mappedStations, totalCount });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("INTERNAL_SERVER_ERROR", { cause: error });
	}
}

const getStations: Route<ReqQuery, ResponseBody> = {
	url: "/stations",
	method: "GET",
	schema: schemaRoute,
	config: { permissions: ["read:stations"], allowGuestAccess: true },
	handler,
};

export default getStations;
