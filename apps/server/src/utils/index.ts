import { eq } from "drizzle-orm/pg-core/expressions";

import { radioLinesAntennaTypes, radioLinesTransmitterTypes } from "@openbts/drizzle";
import db from "../database/psql.js";

import type { operators, ukeRadioLines } from "@openbts/drizzle";
import type { FormattedRadioLine, TxAntennaType } from "@openbts/drizzle/types";

type RadioLine = Omit<typeof ukeRadioLines.$inferSelect, "operator_id"> & {
	operator: Omit<typeof operators.$inferSelect, "is_visible"> | null;
};

type AntennaTypeWithManufacturer = {
	id: number;
	name: string;
	manufacturer: {
		id: number;
		name: string;
	} | null;
} | null;

type TransmitterTypeWithManufacturer = {
	id: number;
	name: string;
	manufacturer: {
		id: number;
		name: string;
	} | null;
} | null;

async function fetchAntennaType(antennaTypeId: number | null): Promise<AntennaTypeWithManufacturer> {
	if (!antennaTypeId) return null;

	try {
		return (
			(await db.query.radioLinesAntennaTypes.findFirst({
				where: eq(radioLinesAntennaTypes.id, antennaTypeId),
				with: {
					manufacturer: true,
				},
			})) || null
		);
	} catch (error) {
		console.error(`Failed to fetch antenna type ${antennaTypeId}:`, error);
		return null;
	}
}

async function fetchTransmitterType(transmitterTypeId: number | null): Promise<TransmitterTypeWithManufacturer> {
	if (!transmitterTypeId) return null;

	try {
		return (
			(await db.query.radioLinesTransmitterTypes.findFirst({
				where: eq(radioLinesTransmitterTypes.id, transmitterTypeId),
				with: {
					manufacturer: true,
				},
			})) || null
		);
	} catch (error) {
		console.error(`Failed to fetch transmitter type ${transmitterTypeId}:`, error);
		return null;
	}
}

function formatTypeWithManufacturer(type: AntennaTypeWithManufacturer | TransmitterTypeWithManufacturer): TxAntennaType | undefined {
	if (!type?.manufacturer) return undefined;

	return {
		id: type.id,
		name: type.name,
		manufacturer: {
			id: type.manufacturer.id,
			name: type.manufacturer.name,
		},
	};
}

function formatTransmitterData(radioLine: RadioLine, txTransmitterType: TransmitterTypeWithManufacturer, txAntennaType: AntennaTypeWithManufacturer) {
	return {
		longitude: radioLine.tx_longitude,
		latitude: radioLine.tx_latitude,
		height: radioLine.tx_height,
		eirp: radioLine.tx_eirp ?? undefined,
		antenna_attenuation: radioLine.tx_antenna_attenuation ?? undefined,
		transmitter_type: formatTypeWithManufacturer(txTransmitterType),
		antenna_type: formatTypeWithManufacturer(txAntennaType),
		antenna_gain: radioLine.tx_antenna_gain ?? undefined,
		antenna_height: radioLine.tx_antenna_height ?? undefined,
	};
}

function formatReceiverData(radioLine: RadioLine, rxAntennaType: AntennaTypeWithManufacturer) {
	return {
		longitude: radioLine.rx_longitude,
		latitude: radioLine.rx_latitude,
		height: radioLine.rx_height,
		antenna_type: formatTypeWithManufacturer(rxAntennaType),
		antenna_gain: radioLine.rx_antenna_gain ?? undefined,
		antenna_height: radioLine.rx_antenna_height ?? undefined,
		noise_figure: radioLine.rx_noise_figure ?? undefined,
		atpc_attenuation: radioLine.rx_atpc_attenuation ?? undefined,
	};
}

export async function formatRadioLine(radioLine: RadioLine): Promise<FormattedRadioLine> {
	try {
		const [txTransmitterType, txAntennaType, rxAntennaType] = await Promise.all([
			fetchTransmitterType(radioLine.tx_transmitter_type_id),
			fetchAntennaType(radioLine.tx_antenna_type_id),
			fetchAntennaType(radioLine.rx_antenna_type_id),
		]);

		return {
			id: radioLine.id,
			tx: formatTransmitterData(radioLine, txTransmitterType, txAntennaType),
			rx: formatReceiverData(radioLine, rxAntennaType),
			freq: radioLine.freq,
			ch_num: radioLine.ch_num ?? undefined,
			plan_symbol: radioLine.plan_symbol ?? undefined,
			ch_width: radioLine.ch_width ?? undefined,
			polarization: radioLine.polarization ?? undefined,
			modulation_type: radioLine.modulation_type ?? undefined,
			bandwidth: radioLine.bandwidth ?? undefined,
			operator: radioLine.operator ?? undefined,
			permit_number: radioLine.permit_number ?? undefined,
			decision_type: radioLine.decision_type ?? undefined,
			expiry_date: radioLine.expiry_date,
			last_updated: radioLine.last_updated,
			date_created: radioLine.date_created,
		};
	} catch (error) {
		console.error("Failed to format radio line:", error);
		throw new Error(`Failed to format radio line with ID ${radioLine.id}`);
	}
}
