import { z } from "zod/v4";

import db from "../../../../../database/psql.js";
import { ErrorResponse } from "../../../../../errors.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../../interfaces/fastify.interface.js";
import type { IdParams, JSONBody, Route } from "../../../../../interfaces/routes.interface.js";

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
const operatorSchema = z.object({ id: z.number(), name: z.string(), mnc_code: z.number() }).nullable().optional();
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
	params: z.object({ id: z.number() }),
	response: {
		200: z.object({ success: z.boolean(), data: radioLineResponseSchema }),
	},
};

async function handler(req: FastifyRequest<IdParams>, res: ReplyPayload<JSONBody<RadioLineResponse>>) {
	const { id } = req.params;

	try {
		const radioLine = await db.query.ukeRadioLines.findFirst({
			where: (fields, { eq }) => eq(fields.id, id),
			with: {
				operator: {
					columns: {
						is_isp: false,
					},
				},
				txTransmitterType: {
					with: { manufacturer: true },
				},
				txAntennaType: {
					with: { manufacturer: true },
				},
				rxAntennaType: {
					with: { manufacturer: true },
				},
			},
		});

		if (!radioLine) throw new ErrorResponse("NOT_FOUND");

		const operator = radioLine.operator ? { id: radioLine.operator.id, name: radioLine.operator.name, mnc_code: radioLine.operator.mnc } : null;

		const mapType = (t: { id: number; name: string; manufacturer: { id: number; name: string } | null } | null | undefined) =>
			t
				? {
						id: t.id,
						name: t.name,
						manufacturer: t.manufacturer ? { id: t.manufacturer.id, name: t.manufacturer.name } : undefined,
					}
				: undefined;

		const data: RadioLineResponse = {
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
			operator,
			permit: {
				number: radioLine.permit_number ?? undefined,
				decision_type: radioLine.decision_type ?? undefined,
				expiry_date: radioLine.expiry_date,
			},
			updatedAt: radioLine.updatedAt,
			createdAt: radioLine.createdAt,
		};

		return res.send({ success: true, data });
	} catch (error) {
		if (error instanceof ErrorResponse) throw error;
		throw new ErrorResponse("INTERNAL_SERVER_ERROR");
	}
}

const getUkeRadioLine: Route<IdParams, RadioLineResponse> = {
	url: "/uke/radiolines/:id",
	method: "GET",
	config: { permissions: ["read:uke_radiolines"] },
	schema: schemaRoute,
	handler,
};

export default getUkeRadioLine;
