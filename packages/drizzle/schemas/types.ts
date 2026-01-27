import type { ukePermits, ukeRadioLines } from "./bts.ts";

export type UkePermission = typeof ukePermits.$inferSelect;
export type NewUkePermission = typeof ukePermits.$inferInsert;
export type NewUkeRadioLine = typeof ukeRadioLines.$inferInsert;

export interface FormattedRadioLine {
	id: number;
	tx: {
		longitude: number;
		latitude: number;
		height: number;
		eirp?: number;
		antenna_attenuation?: number;
		transmitter_type?: TxAntennaType;
		transmitter_manufacturer?: string;
		antenna_type?: TxAntennaType;
		antenna_manufacturer?: string;
		antenna_gain?: number;
		antenna_height?: number;
	};
	rx: {
		longitude: number;
		latitude: number;
		height: number;
		antenna_type?: TxAntennaType;
		antenna_manufacturer?: string;
		antenna_gain?: number;
		antenna_height?: number;
		noise_figure?: number;
		atpc_attenuation?: number;
	};
	freq: number;
	ch_num?: number;
	plan_symbol?: string;
	ch_width?: number;
	polarization?: string;
	modulation_type?: string;
	bandwidth?: string;
	operator?: RadioLineOperator | null;
	permit_number?: string;
	decision_type?: string;
	expiry_date: Date;
	updatedAt: Date;
	createdAt: Date;
}

export interface RadioLineOperator {
	id: number;
	name: string;
	mnc_code: number;
}

export interface TxAntennaType {
	id: number;
	name: string;
	manufacturer: {
		id: number;
		name: string;
	};
}
