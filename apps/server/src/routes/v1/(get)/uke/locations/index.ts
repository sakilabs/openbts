import { sql, count, type SQL, inArray, and } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { bands, operators, ukePermits, ukeLocations, regions } from "@openbts/drizzle";
import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const ukeLocationsSchema = createSelectSchema(ukeLocations).omit({ point: true, region_id: true });
const ukePermitsSchema = createSelectSchema(ukePermits).omit({ location_id: true, operator_id: true, band_id: true });
const bandsSchema = createSelectSchema(bands);
const operatorsSchema = createSelectSchema(operators);
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
		new: z.coerce.boolean().optional().default(false),
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
	const { bounds, limit, page, rat, operators: operatorMncs, bands: bandValues, regions: regionNames, new: recentOnly } = req.query;
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
		bandValues?.length ? db.select({ id: bands.id }).from(bands).where(inArray(bands.value, bandValues)) : [],
		expandedOperatorMncs?.length ? db.select({ id: operators.id }).from(operators).where(inArray(operators.mnc, expandedOperatorMncs)) : [],
		regionNames?.length ? db.select({ id: regions.id }).from(regions).where(inArray(regions.name, regionNames)) : [],
	]);

	const bandIds = bandRows.map((b) => b.id);
	const operatorIds = operatorRows.map((r) => r.id);
	const regionIds = regionsRows.map((r) => r.id);

	if (bandValues?.length && !bandIds.length) return res.send({ data: [], totalCount: 0 });

	const requestedRats = rat ?? [];
	type RatType = "GSM" | "UMTS" | "LTE" | "NR" | "CDMA" | "IOT";
	const ratMap: Record<string, RatType> = { gsm: "GSM", umts: "UMTS", lte: "LTE", "5g": "NR", cdma: "CDMA", iot: "IOT" } as const;
	const mappedRats: RatType[] = requestedRats.map((r) => ratMap[r]).filter((r): r is RatType => r !== undefined);
	const hasPermitFilters = operatorIds.length || bandIds.length || mappedRats.length;

	const locationConditions: SQL<unknown>[] = [];

	if (envelope) locationConditions.push(sql`ST_Intersects(${ukeLocations.point}, ${envelope})`);
	if (regionIds.length) locationConditions.push(inArray(ukeLocations.region_id, regionIds));
	if (recentOnly) {
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		locationConditions.push(sql`(${ukeLocations.createdAt} >= ${thirtyDaysAgo.toISOString()} OR ${ukeLocations.updatedAt} >= ${thirtyDaysAgo.toISOString()})`);
	}
	if (hasPermitFilters) {
		const permitConditions: SQL<unknown>[] = [sql`ps.location_id = ${ukeLocations.id}`];

		if (operatorIds.length) {
			permitConditions.push(
				sql`ps.operator_id IN (${sql.join(
					operatorIds.map((id) => sql`${id}`),
					sql`,`,
				)})`,
			);
		}

		if (bandIds.length) {
			permitConditions.push(
				sql`ps.band_id IN (${sql.join(
					bandIds.map((id) => sql`${id}`),
					sql`,`,
				)})`,
			);
		}

		if (mappedRats.length) {
			permitConditions.push(
				sql`EXISTS (
					SELECT 1 FROM ${bands}
					WHERE ${bands}.id = ps.band_id
					AND ${bands}.rat IN (${sql.join(
						mappedRats.map((r) => sql`${r}`),
						sql`,`,
					)})
				)`,
			);
		}

		locationConditions.push(
			sql`EXISTS (
				SELECT 1 FROM uke_permits ps
				WHERE ${and(...permitConditions)}
			)`,
		);
	} else {
		locationConditions.push(
			sql`EXISTS (
				SELECT 1 FROM uke_permits ps
				WHERE ps.location_id = ${ukeLocations.id}
			)`,
		);
	}

	try {
		const whereClause = and(...locationConditions);
		const countResult = await db.select({ count: count() }).from(ukeLocations).where(whereClause);
		const totalCount = countResult[0]?.count ?? 0;

		if (totalCount === 0) {
			return res.send({ data: [], totalCount: 0 });
		}

		const locationRows = await db.query.ukeLocations.findMany({
			with: {
				region: true,
				permits: {
					columns: { location_id: false, operator_id: false, band_id: false },
					with: {
						band: true,
						operator: true,
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
			orderBy: (fields, ops) => [ops.desc(fields.id)],
		});

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
