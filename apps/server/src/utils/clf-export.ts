export type ClfFormat = "2.0" | "2.1" | "3.0-dec" | "3.0-hex" | "4.0";

export interface CellExportData {
	cid: number;
	lac?: number | null;
	tac?: number | null;
	nrtac?: number | null;
	rnc?: number | null;
	cid_long?: number | null;
	enbid?: number | null;
	clid?: number | null;
	ecid?: number | null;
	gnbid?: number | null;
	nci?: number | null;
	rat: "GSM" | "UMTS" | "LTE" | "NR";
	band_value?: number | null;
	band_name: string;
	station_id: string;
	operator_mnc?: number | null;
	latitude?: number | null;
	longitude?: number | null;
	notes?: string | null;
}

export function toCLF20(cell: CellExportData): string | null {
	const lac = cell.lac ?? cell.tac ?? cell.nrtac;
	const cellId = getCellIdForExport(cell);
	if (!cellId || !lac) return null;

	const cellHex = cellId.toString(16).toUpperCase().padStart(4, "0");
	const lacHex = lac.toString(16).toUpperCase().padStart(4, "0");
	const mccmnc = getMCCMNC(cell);
	const description = getDescription(cell);

	return `${cellHex}${lacHex}${mccmnc}\t${description}`;
}

export function toCLF21(cell: CellExportData): string | null {
	const lac = cell.lac ?? cell.tac ?? cell.nrtac;
	const cellId = getCellIdForExport(cell);
	if (!cellId || !lac) return null;

	const cellDec = cellId.toString().padStart(5, "0");
	const lacDec = lac.toString().padStart(5, "0");
	const mccmnc = getMCCMNC(cell);
	const description = getDescription(cell);

	return `${cellDec}${lacDec}${mccmnc}\t${description}`;
}

export function toCLF30Hex(cell: CellExportData): string | null {
	const lac = cell.lac ?? cell.tac ?? cell.nrtac ?? 0;
	const cellId = getCellIdForExport(cell);
	if (!cellId) return null;

	const mccmnc = getMCCMNC(cell);
	const cidHex = `0x${cellId.toString(16).toUpperCase().padStart(4, "0")}`;
	const lacHex = `0x${lac.toString(16).toUpperCase().padStart(4, "0")}`;
	const rncHex = `0x${(cell.rnc ?? 0).toString(16).toUpperCase().padStart(4, "0")}`;
	const lat = cell.latitude ?? 0;
	const lon = cell.longitude ?? 0;
	const rat = getRatCode(cell.rat);
	const description = getDescription(cell);

	return `${mccmnc};${cidHex};${lacHex};${rncHex};${lat};${lon};${rat};${description};0`;
}

export function toCLF30Dec(cell: CellExportData): string | null {
	const lac = cell.lac ?? cell.tac ?? cell.nrtac ?? 0;
	const cellId = getCellIdForExport(cell);
	if (!cellId) return null;

	const mccmnc = getMCCMNC(cell);
	const cidDec = cellId.toString().padStart(5, "0");
	const lacDec = lac.toString().padStart(5, "0");
	const rncDec = (cell.rnc ?? 0).toString().padStart(5, "0");
	const lat = cell.latitude ?? 0;
	const lon = cell.longitude ?? 0;
	const rat = getRatCode(cell.rat);
	const description = getDescription(cell);

	return `${mccmnc};${cidDec};${lacDec};${rncDec};${lat};${lon};${rat};${description};0`;
}

export function toCLF40(cell: CellExportData): string | null {
	const lac = cell.lac ?? cell.tac ?? cell.nrtac ?? 0;
	const cellId = getCellIdForExport(cell);
	if (!cellId) return null;

	const mccmnc = getMCCMNC(cell);
	const type = getRatCode(cell.rat);
	const lat = cell.latitude ?? 0;
	const lon = cell.longitude ?? 0;
	const posRat = -1;
	const description = getDescription(cell);
	const sys = getRatCode(cell.rat);
	const label = `${cell.station_id}_${cellId}`;
	const azi = 0;
	const height = 0;
	const hbw = 0;
	const vbw = 0;
	const tilt = 0;
	const loc = cell.station_id;

	return `${mccmnc};${cellId.toString().padStart(5, "0")};${lac.toString().padStart(5, "0")};${type};${lat};${lon};${posRat};${description};${sys};${label};${azi};${height};${hbw};${vbw};${tilt};${loc}`;
}

function getCellIdForExport(cell: CellExportData): number | null {
	switch (cell.rat) {
		case "GSM":
			return cell.cid;
		case "UMTS":
			return cell.cid_long ?? cell.cid;
		case "LTE":
			return cell.ecid ?? cell.cid;
		case "NR":
			return cell.nci ?? cell.cid;
		default:
			return null;
	}
}

function getMCCMNC(cell: CellExportData): string {
	const mcc = "260";
	const mnc = cell.operator_mnc?.toString().padStart(2, "0") ?? "00";
	return `${mcc}${mnc}`;
}

function getRatCode(rat: "GSM" | "UMTS" | "LTE" | "NR"): number {
	switch (rat) {
		case "GSM":
			return 0;
		case "UMTS":
			return 1;
		case "LTE":
			return 2;
		case "NR":
			return 3;
		default:
			return -1;
	}
}

function getDescription(cell: CellExportData): string {
	const parts: string[] = [];
	if (cell.band_name) parts.push(cell.band_name);
	if (cell.notes) parts.push(cell.notes);

	return parts.join(" - ").substring(0, 100) || "N/A";
}

export function convertToCLF(cell: CellExportData, format: ClfFormat): string | null {
	switch (format) {
		case "2.0":
			return toCLF20(cell);
		case "2.1":
			return toCLF21(cell);
		case "3.0-dec":
			return toCLF30Dec(cell);
		case "3.0-hex":
			return toCLF30Hex(cell);
		case "4.0":
			return toCLF40(cell);
		default:
			return null;
	}
}

export function sortCLFLines(lines: string[]): string[] {
	return lines.sort((a, b) => a.localeCompare(b));
}
