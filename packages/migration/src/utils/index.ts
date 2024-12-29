import type { OperatorRow } from "../interfaces/csv.js";

type OperatorMapping = {
	parent?: string | null;
	mnc: number;
};

export const OPERATOR_MAPPINGS: Record<string, OperatorMapping> = {
	"NetWorkS!": { mnc: 26034 },
	"T-Mobile": { parent: "NetWorkS!", mnc: 26002 },
	Orange: { parent: "NetWorkS!", mnc: 26003 },
	Plus: { parent: null, mnc: 26001 },
	Aero2: { parent: "Plus", mnc: 26017 },
	Play: { mnc: 26006 },
	Mobyland: { mnc: 26016 },
	CenterNet: { mnc: 26015 },
	Nordisk: { mnc: 26011 },
	Sferia: { mnc: 26010 },
	"PGE Systemy": { mnc: 26018 },
};

export function convertDMSToDD(coord: string) {
	const direction = coord.charAt(2);
	const degrees = Number.parseInt(coord.slice(0, 2));
	const minutes = Number.parseInt(coord.slice(3, 5));
	const seconds = Number.parseInt(coord.slice(5, 7));

	let dd = degrees + minutes / 60 + seconds / 3600;

	if (direction === "W" || direction === "S") dd = -dd;

	return Number.parseFloat(dd.toFixed(6));
}

export function determineOperatorFromRow(row: OperatorRow) {
	const siecId = row.siec_id;
	const notes = row.uwagi?.toLowerCase() || "";

	if (notes.includes("networks") || OPERATOR_MAPPINGS[siecId]?.parent === "NetWorkS!") {
		return {
			name: siecId,
			parent: "NetWorkS!",
			mnc: OPERATOR_MAPPINGS[siecId]?.mnc || 0,
			parentMnc: 26034,
		};
	}

	return {
		name: siecId,
		parent: OPERATOR_MAPPINGS[siecId]?.parent || null,
		mnc: OPERATOR_MAPPINGS[siecId]?.mnc || 0,
		parentMnc: OPERATOR_MAPPINGS[siecId]?.parent ? OPERATOR_MAPPINGS[OPERATOR_MAPPINGS[siecId]?.parent]?.mnc || 0 : null,
	};
}
