import { sql, count, and as drizzleAnd, type SQL } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { bands, operators, ukePermits, ukeLocations, regions } from "@openbts/drizzle";
import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const ukeLocationsSchema = createSelectSchema(ukeLocations).omit({ point: true, region_id: true });
const ukePermitsSchema = createSelectSchema(ukePermits).omit({ location_id: true });
const bandsSchema = createSelectSchema(bands);
const operatorsSchema = createSelectSchema(operators).omit({ is_isp: true });
const regionsSchema = createSelectSchema(regions);

const permitResponseSchema = ukePermitsSchema.extend({
	band: bandsSchema.nullable(),
	operator: operatorsSchema.nullable(),
});

const schemaRoute = {
	querystring: z.object({
		bounds: z
			.string()
			.regex(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/)
			.optional()
			.transform((val): number[] | undefined => (val ? val.split(",").map(Number) : undefined)),
		limit: z.coerce.number().min(1).max(1000).optional().default(500),
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
			data: z.array(
				ukeLocationsSchema.extend({
					region: regionsSchema,
					permits: z.array(permitResponseSchema),
				}),
			),
			totalCount: z.number(),
		}),
	},
};

type ReqQuery = { Querystring: z.infer<typeof schemaRoute.querystring> };
type PermitData = z.infer<typeof permitResponseSchema>;
type ResponseData = z.infer<typeof ukeLocationsSchema> & {
	region: z.infer<typeof regionsSchema>;
	permits: PermitData[];
};
type ResponseBody = { data: ResponseData[]; totalCount: number };

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<ResponseBody>>) {
	const { bounds, limit, page, rat, operators: operatorMncs, bands: bandValues, regions: regionNames } = req.query;
	const offset = (page - 1) * limit;

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
		regionNames?.length
			? db.query.regions.findMany({
					columns: { id: true },
					where: (f, { inArray }) => inArray(f.name, regionNames),
				})
			: [],
	]);

	const bandIds = bandRows.map((b) => b.id);
	const operatorIds = operatorRows.map((r) => r.id);
	const regionIds = regionsRows.map((r) => r.id);

	if (bandValues?.length && !bandIds.length) return res.send({ data: [], totalCount: 0 });

	const requestedRats = rat ?? [];
	type RatType = "GSM" | "UMTS" | "LTE" | "NR" | "CDMA";
	const ratMap: Record<string, RatType> = { gsm: "GSM", umts: "UMTS", lte: "LTE", "5g": "NR", cdma: "CDMA" } as const;
	const mappedRats: RatType[] = requestedRats.map((r) => ratMap[r]).filter((r): r is RatType => r !== undefined);

	const hasPermitFilters = operatorIds.length || bandIds.length || mappedRats.length;

	const buildPermitFilter = (): SQL<unknown> | undefined => {
		if (!hasPermitFilters) return undefined;

		const conditions: SQL<unknown>[] = [];

		if (operatorIds.length) {
			conditions.push(
				sql`${ukePermits.operator_id} = ANY(ARRAY[${sql.join(
					operatorIds.map((id) => sql`${id}`),
					sql`,`,
				)}]::int4[])`,
			);
		}

		if (bandIds.length || mappedRats.length) {
			const bandConditions: SQL<unknown>[] = [];

			if (bandIds.length) {
				bandConditions.push(
					sql`${ukePermits.band_id} = ANY(ARRAY[${sql.join(
						bandIds.map((id) => sql`${id}`),
						sql`,`,
					)}]::int4[])`,
				);
			}

			if (mappedRats.length) {
				bandConditions.push(
					sql`EXISTS (
						SELECT 1 FROM ${bands} b
						WHERE b.id = ${ukePermits.band_id}
						AND UPPER(b.rat) IN (${sql.join(
							mappedRats.map((r) => sql`${r}`),
							sql`,`,
						)})
					)`,
				);
			}

			if (bandConditions.length > 1) {
				conditions.push(sql`(${sql.join(bandConditions, sql` AND `)})`);
			} else if (bandConditions[0]) {
				conditions.push(bandConditions[0]);
			}
		}

		return conditions.length > 1 ? sql`(${sql.join(conditions, sql` AND `)})` : conditions[0];
	};

	const buildLocationConditions = (): SQL<unknown>[] => {
		const conditions: SQL<unknown>[] = [];

		if (envelope) {
			conditions.push(sql`ST_Intersects(${ukeLocations.point}, ${envelope})`);
		}

		if (regionIds.length) {
			conditions.push(
				sql`${ukeLocations.region_id} = ANY(ARRAY[${sql.join(
					regionIds.map((id) => sql`${id}`),
					sql`,`,
				)}]::int4[])`,
			);
		}

		if (hasPermitFilters) {
			const operatorCond = operatorIds.length
				? sql` AND p.operator_id = ANY(ARRAY[${sql.join(
						operatorIds.map((id) => sql`${id}`),
						sql`,`,
					)}]::int4[])`
				: sql``;

			const bandCond = bandIds.length
				? sql` AND p.band_id = ANY(ARRAY[${sql.join(
						bandIds.map((id) => sql`${id}`),
						sql`,`,
					)}]::int4[])`
				: sql``;

			const ratCond = mappedRats.length
				? sql` AND EXISTS (
						SELECT 1 FROM ${bands} b
						WHERE b.id = p.band_id
						AND UPPER(b.rat) IN (${sql.join(
							mappedRats.map((r) => sql`${r}`),
							sql`,`,
						)})
					)`
				: sql``;

			conditions.push(sql`
				EXISTS (
					SELECT 1
					FROM ${ukePermits} p
					WHERE p.location_id = ${ukeLocations.id}
					${operatorCond}
					${bandCond}
					${ratCond}
				)
			`);
		} else {
			conditions.push(sql`
				EXISTS (
					SELECT 1
					FROM ${ukePermits} p
					WHERE p.location_id = ${ukeLocations.id}
				)
			`);
		}

		return conditions;
	};

	const locationConditions = buildLocationConditions();

	try {
		const whereClause = locationConditions.length ? drizzleAnd(...locationConditions) : undefined;

		const [countResult, locationRows] = await Promise.all([
			db.select({ count: count() }).from(ukeLocations).where(whereClause),
			db.query.ukeLocations.findMany({
				with: {
					region: true,
					permits: {
						columns: { location_id: false },
						where: buildPermitFilter(),
						with: {
							band: true,
							operator: { columns: { is_isp: false } },
						},
					},
				},
				columns: {
					point: false,
					region_id: false,
				},
				where: whereClause,
				limit,
				offset,
				orderBy: (fields, operators) => [operators.desc(fields.id)],
			}),
		]);

		const totalCount = countResult[0]?.count ?? 0;

		return res.send({ data: locationRows, totalCount });
	} catch (error) {
		console.error(error);
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("INTERNAL_SERVER_ERROR", {
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

const getUkeLocations: Route<ReqQuery, ResponseBody> = {
	url: "/uke/locations",
	method: "GET",
	config: { permissions: ["read:uke_permits"], allowGuestAccess: true },
	schema: schemaRoute,
	handler,
};

export default getUkeLocations;
