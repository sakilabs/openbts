export type OperatorKey =
	| "T-Mobile"
	| "Orange"
	| "Plus"
	| "Aero2"
	| "Play"
	| "Mobyland"
	| "CenterNet"
	| "Nordisk"
	| "Sferia"
	| "PGE Systemy"
	| "NetWorkS!";
export type OperatorRow = { siec_id: OperatorKey; uwagi?: string };

export interface CsvRow {
	siec_id: OperatorKey;
	wojewodztwo_id: string;
	miejscowosc: string;
	lokalizacja: string;
	StationId: string;
	lac: string;
	RNC: string;
	eNBI: string;
	uwagi: string;
	aktualizacja: string;
	standard: string;
	pasmo: string;
	duplex: string | null;
	ECID: string;
	CLID: string;
	btsid: string | null;
	carrier: string;
	LONGuke: string;
	LATIuke: string;
}

export interface LocationData {
	miejscowosc: string;
	lokalizacja: string;
	LONGuke: string;
	LATIuke: string;
}
