import { eq, ilike, sql, type SQL } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { bands, operators, ukePermits, ukeLocations } from "@openbts/drizzle";
import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const ukePermitsSchema = createSelectSchema(ukePermits);
const bandsSchema = createSelectSchema(bands);
const operatorsSchema = createSelectSchema(operators).omit({ is_isp: true });
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
		decisionType: z.literal(["zmP", "P"]).optional(),
		decision_number: z.string().optional(),
		station_id: z.string().optional(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: z.array(ukePermitsSchema.extend({ band: bandsSchema, operator: operatorsSchema })),
		}),
	},
};
type ReqQuery = {
	Querystring: z.infer<typeof schemaRoute.querystring>;
};
type Permit = z.infer<typeof ukePermitsSchema> & { band?: z.infer<typeof bandsSchema>; operator?: z.infer<typeof operatorsSchema> };

const SIMILARITY_THRESHOLD = 0.6;

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<Permit[]>>) {
	const {
		limit = undefined,
		page = 1,
		bounds,
		operators: operatorsQuery,
		rat,
		bands: bandsQuery,
		decisionType,
		decision_number,
		station_id,
	} = req.query;
	const offset = limit ? (page - 1) * limit : undefined;

	let bandIds: number[] | undefined;
	if (bandsQuery) {
		const requestedBandIds = bandsQuery.split(",").map(Number);
		const validBands = await db.query.bands.findMany({
			columns: { id: true },
			where: (fields, { inArray }) => inArray(fields.value, requestedBandIds),
		});

		bandIds = validBands.map((band) => band.id);
		if (bandIds.length === 0) return res.send({ success: true, data: [] });
	}

	try {
		const conditions: (SQL<unknown> | undefined)[] = [];

		let locationIds: number[] | undefined;
		if (bounds) {
			const splitBounds = bounds.split(",").map(Number);
			if (splitBounds.length !== 4 || splitBounds.some(Number.isNaN)) throw new ErrorResponse("BAD_REQUEST");
			const [la1, lo1, la2, lo2] = splitBounds as [number, number, number, number];
			const [west, south] = [Math.min(lo1, lo2), Math.min(la1, la2)];
			const [east, north] = [Math.max(lo1, lo2), Math.max(la1, la2)];

			const boundaryLocations = await db
				.select({ id: ukeLocations.id })
				.from(ukeLocations)
				.where(sql`ST_Intersects(${ukeLocations.point}, ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326))`);

			locationIds = boundaryLocations.map((loc) => loc.id);
			if (!locationIds.length) return res.send({ success: true, data: [] });
		}

		let operatorIds: number[] | undefined;
		if (operatorsQuery) {
			const operatorMncs = operatorsQuery
				.split(",")
				.map((op) => Number.parseInt(op, 10))
				.filter((mnc) => !Number.isNaN(mnc));
			if (operatorMncs.length === 0) return res.send({ success: true, data: [] });

			const operatorQueries = operatorMncs.map((mnc) =>
				db.query.operators.findMany({
					columns: { id: true },
					where: (fields, { eq }) => eq(fields.mnc, mnc),
				}),
			);

			const operatorResults = await Promise.all(operatorQueries);
			operatorIds = operatorResults.flat().map((op) => op.id);
			if (!operatorIds.length) return res.send({ success: true, data: [] });
		}

		const ukePermitsRes = await db.query.ukePermits.findMany({
			with: {
				band: true,
				operator: true,
			},
			where: (fields, { and, inArray, or }) => {
				if (operatorIds) conditions.push(inArray(fields.operator_id, operatorIds));
				if (bandIds && bandIds.length > 0) conditions.push(inArray(fields.band_id, bandIds));
				if (locationIds) conditions.push(inArray(fields.location_id, locationIds));
				if (decisionType) conditions.push(eq(fields.decision_type, decisionType));
				if (decision_number) {
					const like = `%${decision_number}%`;
					conditions.push(
						or(ilike(fields.decision_number, like), sql`similarity(${fields.decision_number}, ${decision_number}) > ${SIMILARITY_THRESHOLD}`),
					);
				}
				if (station_id) {
					const like = `%${station_id}%`;
					conditions.push(or(ilike(fields.station_id, like), sql`similarity(${fields.station_id}, ${station_id}) > ${SIMILARITY_THRESHOLD}`));
				}

				return conditions.length > 0 ? and(...conditions) : undefined;
			},
			limit,
			offset: offset,
		});

		let data = ukePermitsRes;
		if (rat) {
			const requestedRats = rat.toLowerCase().split(",");
			const ratMap: Record<string, "gsm" | "umts" | "lte" | "nr"> = { gsm: "gsm", umts: "umts", lte: "lte", "5g": "nr" } as const;
			const allowedRats = requestedRats.map((t) => ratMap[t]).filter((t): t is "gsm" | "umts" | "lte" | "nr" => t !== undefined);
			data = data.filter((permit) =>
				permit.band?.rat ? allowedRats.includes(permit.band.rat.toLowerCase() as (typeof allowedRats)[number]) : false,
			);
		}

		res.send({ success: true, data });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const getUkePermits: Route<ReqQuery, Permit[]> = {
	url: "/uke/permits",
	method: "GET",
	schema: schemaRoute,
	config: { permissions: ["read:uke_permits"] },
	handler,
};

export default getUkePermits;
