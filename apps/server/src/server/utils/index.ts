import { eq } from "drizzle-orm/pg-core/expressions";

import { radioLinesAntennaTypes, radioLinestTansmitterTypes } from "@openbts/drizzle";
import db from "../database/psql.js";

import type { operators, ukeRadioLines } from "@openbts/drizzle";
import type { FormattedRadioLine } from "@openbts/drizzle/types";

type RadioLine = Omit<typeof ukeRadioLines.$inferSelect, "operator_id"> & { operator: (typeof operators.$inferSelect) | null };

export async function formatRadioLine(radioLine: RadioLine): Promise<FormattedRadioLine> {
	const [txTransmitterType, txAntennaType, rxAntennaType] = await Promise.all([
		radioLine.tx_transmitter_type_id
			? db.query.radioLinestTansmitterTypes.findFirst({
					where: eq(radioLinestTansmitterTypes.id, radioLine.tx_transmitter_type_id),
					with: {
						manufacturer: true,
					},
				})
			: null,
		radioLine.tx_antenna_type_id
			? db.query.radioLinesAntennaTypes.findFirst({
					where: eq(radioLinesAntennaTypes.id, radioLine.tx_antenna_type_id),
					with: {
						manufacturer: true,
					},
				})
			: null,
		radioLine.rx_antenna_type_id
			? db.query.radioLinesAntennaTypes.findFirst({
					where: eq(radioLinesAntennaTypes.id, radioLine.rx_antenna_type_id),
					with: {
						manufacturer: true,
					},
				})
			: null,
	]);

	return {
		id: radioLine.id,
		tx: {
			longitude: radioLine.tx_longitude,
			latitude: radioLine.tx_latitude,
			height: radioLine.tx_height,
			eirp: radioLine.tx_eirp ?? undefined,
			antenna_attenuation: radioLine.tx_antenna_attenuation ?? undefined,
			transmitter_type: txTransmitterType?.manufacturer
				? {
						id: txTransmitterType.id,
						name: txTransmitterType.name,
						manufacturer: {
							id: txTransmitterType.manufacturer.id,
							name: txTransmitterType.manufacturer.name,
						},
					}
				: undefined,
			antenna_type: txAntennaType?.manufacturer
				? {
						id: txAntennaType.id,
						name: txAntennaType.name,
						manufacturer: {
							id: txAntennaType.manufacturer.id,
							name: txAntennaType.manufacturer.name,
						},
					}
				: undefined,
			antenna_gain: radioLine.tx_antenna_gain ?? undefined,
			antenna_height: radioLine.tx_antenna_height ?? undefined,
		},
		rx: {
			longitude: radioLine.rx_longitude,
			latitude: radioLine.rx_latitude,
			height: radioLine.rx_height,
			antenna_type: rxAntennaType?.manufacturer
				? {
						id: rxAntennaType.id,
						name: rxAntennaType.name,
						manufacturer: {
							id: rxAntennaType.manufacturer.id,
							name: rxAntennaType.manufacturer.name,
						},
					}
				: undefined,
			antenna_gain: radioLine.rx_antenna_gain ?? undefined,
			antenna_height: radioLine.rx_antenna_height ?? undefined,
			noise_figure: radioLine.rx_noise_figure ?? undefined,
			atpc_attenuation: radioLine.rx_atpc_attenuation ?? undefined,
		},
		freq: radioLine.freq,
		ch_num: radioLine.ch_num ?? undefined,
		plan_symbol: radioLine.plan_symbol ?? undefined,
		ch_width: radioLine.ch_width ?? undefined,
		polarization: radioLine.polarization ?? undefined,
		modulation_type: radioLine.modulation_type ?? undefined,
		bandwidth: radioLine.bandwidth ?? undefined,
		operator: radioLine?.operator ?? undefined,
		permit_number: radioLine.permit_number ?? undefined,
		decision_type: radioLine.decision_type ?? undefined,
		expiry_date: radioLine.expiry_date,
		last_updated: radioLine.last_updated,
		date_created: radioLine.date_created,
	};
}
