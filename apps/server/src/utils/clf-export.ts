export type ClfFormat = "2.0" | "2.1" | "3.0-dec" | "3.0-hex" | "4.0" | "ntm" | "netmonitor";

const NTM_UNKNOWN = 2147483647; // 2^31-1

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
  nci?: bigint | null;
  rat: "GSM" | "CDMA" | "UMTS" | "LTE" | "NR";
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
  const mccmnc = cell.operator_mnc;
  const description = getDescription(cell);

  return `${cellHex}${lacHex}${mccmnc}\t${description}`;
}

export function toCLF21(cell: CellExportData): string | null {
  const lac = cell.lac ?? cell.tac ?? cell.nrtac;
  const cellId = getCellIdForExport(cell);
  if (!cellId || !lac) return null;

  const cellDec = cellId.toString().padStart(5, "0");
  const lacDec = lac.toString().padStart(5, "0");
  const mccmnc = cell.operator_mnc;
  const description = getDescription(cell);

  return `${cellDec}${lacDec}${mccmnc}\t${description}`;
}

export function toCLF30Hex(cell: CellExportData): string | null {
  const lac = cell.lac ?? cell.tac ?? cell.nrtac ?? 0;
  const cellId = getCellIdForExport(cell);
  if (!cellId) return null;

  const mccmnc = cell.operator_mnc;
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

  const mccmnc = cell.operator_mnc;
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

  const mccmnc = cell.operator_mnc;
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

function getCellIdForExport(cell: CellExportData): bigint | number | null {
  switch (cell.rat) {
    case "GSM":
      return cell.cid;
    case "CDMA":
      return cell.clid ?? cell.cid;
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
function getRatCode(rat: "GSM" | "CDMA" | "UMTS" | "LTE" | "NR" | "IOT"): number {
  switch (rat) {
    case "GSM":
      return 1;
    case "CDMA":
      return 2;
    case "UMTS":
      return 3;
    case "LTE":
      return 4;
    case "NR":
      return 5;
    default:
      return 0;
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
    case "ntm":
      return toNTM(cell);
    case "netmonitor":
      return toNetMonitor(cell);
    default:
      return null;
  }
}

export function toNTM(cell: CellExportData): string | null {
  const mcc = "260";
  const mnc = cell.operator_mnc?.toString().slice(-2).padStart(2, "0") ?? "00";
  const lat = cell.latitude ?? 0;
  const lon = cell.longitude ?? 0;
  const location = getDescription(cell).replace(/;/g, ",");

  switch (cell.rat) {
    case "GSM": {
      const cid = cell.cid ?? NTM_UNKNOWN;
      const lac = cell.lac ?? NTM_UNKNOWN;
      const bsic = NTM_UNKNOWN;
      const arfcn = NTM_UNKNOWN;
      return `2G;${mcc};${mnc};${cid};${lac};;${bsic};${lat};${lon};${location};${arfcn}`;
    }
    case "UMTS": {
      const cid = cell.cid_long ?? cell.cid ?? NTM_UNKNOWN;
      const lac = cell.lac ?? NTM_UNKNOWN;
      const rnc = cell.rnc ?? NTM_UNKNOWN;
      const psc = NTM_UNKNOWN;
      const uarfcn = NTM_UNKNOWN;
      return `3G;${mcc};${mnc};${cid};${lac};${rnc};${psc};${lat};${lon};${location};${uarfcn}`;
    }
    case "LTE": {
      const ci = cell.clid ?? NTM_UNKNOWN;
      const tac = cell.tac ?? NTM_UNKNOWN;
      const enb = cell.enbid ?? NTM_UNKNOWN;
      const pci = NTM_UNKNOWN;
      const earfcn = NTM_UNKNOWN;
      return `4G;${mcc};${mnc};${ci};${tac};${enb};${pci};${lat};${lon};${location};${earfcn}`;
    }
    case "NR": {
      const nci = cell.nci ?? NTM_UNKNOWN;
      const tac = cell.nrtac ?? NTM_UNKNOWN;
      const pci = NTM_UNKNOWN;
      const arfcn = NTM_UNKNOWN;
      return `5G;${mcc};${mnc};${nci};${tac};;${pci};${lat};${lon};${location};${arfcn}`;
    }
    case "CDMA": {
      const bid = cell.cid ?? NTM_UNKNOWN;
      const nid = NTM_UNKNOWN;
      const sid = NTM_UNKNOWN;
      return `CD2;${mcc};${mnc};${bid};${nid};;${sid};${lat};${lon};${location};`;
    }
    default:
      return null;
  }
}

export function sortCLFLines(lines: string[]): string[] {
  return lines.sort((a, b) => a.localeCompare(b));
}

export function toNetMonitor(cell: CellExportData): string | null {
  const mcc = "260";
  const mnc = cell.operator_mnc?.toString().slice(-2).padStart(2, "0") ?? "00";
  const lat = cell.latitude ?? "";
  const lon = cell.longitude ?? "";
  const accuracy = 100;
  const description = getDescription(cell).replace(/;/g, ",");

  switch (cell.rat) {
    case "GSM": {
      const lac = cell.lac ?? 0;
      const cid = cell.cid ?? 0;
      const bsic = "";
      const arfcn = "";
      return `G;${mcc};${mnc};${lac};${cid};${bsic};${arfcn};${lat};${lon};${accuracy};${description}`;
    }
    case "UMTS": {
      const lac = cell.lac ?? 0;
      const cid = cell.cid_long ?? cell.cid ?? 0;
      const psc = "";
      const uarfcn = "";
      return `W;${mcc};${mnc};${lac};${cid};${psc};${uarfcn};${lat};${lon};${accuracy};${description}`;
    }
    case "LTE": {
      const tac = cell.tac ?? 0;
      const ci = cell.ecid ?? 0;
      const pci = "";
      const earfcn = "";
      return `L;${mcc};${mnc};${tac};${ci};${pci};${earfcn};${lat};${lon};${accuracy};${description}`;
    }
    case "NR": {
      const tac = cell.nrtac ?? 0;
      const nci = cell.nci ?? 0;
      const pci = "";
      const arfcn = "";
      return `N;${mcc};${mnc};${tac};${nci};${pci};${arfcn};${lat};${lon};${accuracy};${description}`;
    }
    case "CDMA": {
      const nid = 0;
      const bid = cell.cid ?? 0;
      const sid = 0;
      return `C;${mcc};${mnc};${nid};${bid};${sid};;${lat};${lon};${accuracy};${description}`;
    }
    default:
      return null;
  }
}
