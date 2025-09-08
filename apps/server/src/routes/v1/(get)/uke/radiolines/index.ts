import { z } from "zod/v4";
import { and, eq, sql, type SQL } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";
import { operators, ukeRadioLines } from "@openbts/drizzle";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

const manufacturerSchema = z.object({ id: z.number(), name: z.string() });
const equipmentTypeSchema = z.object({ id: z.number(), name: z.string(), manufacturer: manufacturerSchema.optional() });
const txSchema = z.object({
	longitude: z.number(),
	latitude: z.number(),
	height: z.number(),
	eirp: z.number().optional(),
	antenna_attenuation: z.number().optional(),
	transmitter: z.object({ type: equipmentTypeSchema.optional() }).optional(),
	antenna: z
		.object({
			type: equipmentTypeSchema.optional(),
			gain: z.number().optional(),
			height: z.number().optional(),
		})
		.optional(),
});
const rxSchema = z.object({
	longitude: z.number(),
	latitude: z.number(),
	height: z.number(),
	type: equipmentTypeSchema.optional(),
	gain: z.number().optional(),
	height_antenna: z.number().optional(),
	noise_figure: z.number().optional(),
	atpc_attenuation: z.number().optional(),
});
const linkSchema = z.object({
	freq: z.number(),
	ch_num: z.number().optional(),
	plan_symbol: z.string().optional(),
	ch_width: z.number().optional(),
	polarization: z.string().optional(),
	modulation_type: z.string().optional(),
	bandwidth: z.string().optional(),
});
const operatorSchema = createSelectSchema(operators).omit({ is_isp: true, full_name: true, mnc: true, parent_id: true }).nullable().optional();
const permitSchema = z.object({
	number: z.string().optional(),
	decision_type: z.string().optional(),
	expiry_date: z.date(),
});
const radioLineResponseSchema = z.object({
	id: z.number(),
	tx: txSchema,
	rx: rxSchema,
	link: linkSchema,
	operator: operatorSchema,
	permit: permitSchema,
	updatedAt: z.date(),
	createdAt: z.date(),
});

type RadioLineResponse = z.infer<typeof radioLineResponseSchema>;
const schemaRoute = {
	querystring: z.object({
		bounds: z
			.string()
			.regex(/^-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+$/)
			.optional(),
		limit: z.coerce.number().min(1).optional().default(150),
		page: z.coerce.number().min(1).default(1),
		operator: z.string().optional(),
		permit_number: z.string().optional(),
		decision_type: z.literal(["zmP", "P"]).optional(),
	}),
	response: {
		200: z.object({
			success: z.boolean(),
			data: z.array(radioLineResponseSchema),
		}),
	},
};
type ReqQuery = {
	Querystring: z.infer<typeof schemaRoute.querystring>;
};

const SIMILARITY_THRESHOLD = 0.6;

async function handler(req: FastifyRequest<ReqQuery>, res: ReplyPayload<JSONBody<RadioLineResponse[]>>) {
	const { limit = undefined, page = 1, bounds, operator, permit_number, decision_type } = req.query;
	const offset = limit ? (page - 1) * limit : undefined;

	try {
		const conditions: (SQL<unknown> | undefined)[] = [];

		if (bounds) {
			const coords = bounds.split(",").map(Number);
			if (coords.length !== 4 || coords.some(Number.isNaN)) throw new ErrorResponse("INVALID_QUERY");
			const [la1, lo1, la2, lo2] = coords as [number, number, number, number];
			const [west, south] = [Math.min(lo1, lo2), Math.min(la1, la2)];
			const [east, north] = [Math.max(lo1, lo2), Math.max(la1, la2)];

			const envelope = sql`ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)`;
			const txPoint = sql`ST_SetSRID(ST_MakePoint(${ukeRadioLines.tx_longitude}, ${ukeRadioLines.tx_latitude}), 4326)`;
			const rxPoint = sql`ST_SetSRID(ST_MakePoint(${ukeRadioLines.rx_longitude}, ${ukeRadioLines.rx_latitude}), 4326)`;
			conditions.push(sql`ST_Intersects(${txPoint}, ${envelope}) AND ST_Intersects(${rxPoint}, ${envelope})`);
		}
		if (operator) conditions.push(and(eq(ukeRadioLines.operator_id, Number.parseInt(operator, 10))));
		if (permit_number) {
			const like = `%${permit_number}%`;
			conditions.push(
				sql`(${ukeRadioLines.permit_number} ILIKE ${like} OR similarity(${ukeRadioLines.permit_number}, ${permit_number}) > ${SIMILARITY_THRESHOLD})`,
			);
		}
		if (decision_type) conditions.push(eq(ukeRadioLines.decision_type, decision_type));

		const radioLinesRes = await db.query.ukeRadioLines.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			with: {
				operator: {
					columns: {
						is_isp: false,
					},
				},
				txTransmitterType: { with: { manufacturer: true } },
				txAntennaType: { with: { manufacturer: true } },
				rxAntennaType: { with: { manufacturer: true } },
			},
			limit: limit,
			offset: offset,
		});

		const mapType = (t: { id: number; name: string; manufacturer: { id: number; name: string } | null } | null | undefined) =>
			t
				? {
						id: t.id,
						name: t.name,
						manufacturer: t.manufacturer ? { id: t.manufacturer.id, name: t.manufacturer.name } : undefined,
					}
				: undefined;

		const data: RadioLineResponse[] = radioLinesRes.map((radioLine) => ({
			id: radioLine.id,
			tx: {
				longitude: radioLine.tx_longitude,
				latitude: radioLine.tx_latitude,
				height: radioLine.tx_height,
				eirp: radioLine.tx_eirp ?? undefined,
				antenna_attenuation: radioLine.tx_antenna_attenuation ?? undefined,
				transmitter: { type: mapType(radioLine.txTransmitterType) },
				antenna: {
					type: mapType(radioLine.txAntennaType),
					gain: radioLine.tx_antenna_gain ?? undefined,
					height: radioLine.tx_antenna_height ?? undefined,
				},
			},
			rx: {
				longitude: radioLine.rx_longitude,
				latitude: radioLine.rx_latitude,
				height: radioLine.rx_height,
				type: mapType(radioLine.rxAntennaType),
				gain: radioLine.rx_antenna_gain ?? undefined,
				height_antenna: radioLine.rx_antenna_height ?? undefined,
				noise_figure: radioLine.rx_noise_figure ?? undefined,
				atpc_attenuation: radioLine.rx_atpc_attenuation ?? undefined,
			},
			link: {
				freq: radioLine.freq,
				ch_num: radioLine.ch_num ?? undefined,
				plan_symbol: radioLine.plan_symbol ?? undefined,
				ch_width: radioLine.ch_width ?? undefined,
				polarization: radioLine.polarization ?? undefined,
				modulation_type: radioLine.modulation_type ?? undefined,
				bandwidth: radioLine.bandwidth ?? undefined,
			},
			operator: radioLine.operator ? { id: radioLine.operator.id, name: radioLine.operator.name } : null,
			permit: {
				number: radioLine.permit_number ?? undefined,
				decision_type: radioLine.decision_type ?? undefined,
				expiry_date: radioLine.expiry_date,
			},
			updatedAt: radioLine.updatedAt,
			createdAt: radioLine.createdAt,
		}));

		res.send({ success: true, data });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const getUkeRadioLines: Route<ReqQuery, RadioLineResponse[]> = {
	url: "/uke/radiolines",
	method: "GET",
	schema: schemaRoute,
	config: { permissions: ["read:uke_radiolines"], allowGuestAccess: true },
	handler,
};

export default getUkeRadioLines;
