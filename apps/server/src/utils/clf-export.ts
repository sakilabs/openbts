export type ClfFormat = "2.0" | "2.1" | "3.0-dec" | "3.0-hex" | "4.0" | "ntm" | "netmonitor";

const NTM_UNKNOWN = 2147483647; // 2^31-1, used in netmonitor format

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
  band_duplex?: "FDD" | "TDD" | null;
  station_id: string;
  operator_mnc?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  city?: string | null;
  address?: string | null;
  arfcn?: number | null; // UMTS UARFCN
  nr_bands?: Array<{ value: number; duplex: "FDD" | "TDD" | null }>; // associated NR bands at same station (for LTE cells)
}

const EARFCN_MAP: Record<number, Partial<Record<number, { fdd?: number; tdd?: number }>>> = {
  26001: {
    800: { fdd: -1 },
    900: { fdd: 3526 },
    1800: { fdd: 1355 },
    2100: { fdd: 350 },
    2600: { fdd: 2850, tdd: 37900 },
  },
  26002: {
    800: { fdd: 6375 },
    900: { fdd: 3686 },
    1800: { fdd: 1599 },
    2100: { fdd: 225 },
    2600: { fdd: 3175, tdd: -1 },
  },
  26003: {
    700: { fdd: 9310 },
    800: { fdd: 6200 },
    900: { fdd: 3764 },
    1800: { fdd: 1749 },
    2100: { fdd: 75 },
    2600: { fdd: 3025, tdd: -1 },
  },
  26006: {
    700: { fdd: 9460 },
    800: { fdd: 6275 },
    900: { fdd: 3476 },
    1800: { fdd: 1875 },
    2100: { fdd: 525 },
    2600: { fdd: 3350, tdd: -1 },
  },
};

function getEarfcn(mnc: number | null | undefined, bandValue: number | null | undefined, duplex: "FDD" | "TDD" | null | undefined): number {
  if (!mnc || !bandValue) return NTM_UNKNOWN;
  const entry = EARFCN_MAP[mnc]?.[bandValue];
  if (!entry) return NTM_UNKNOWN;
  return (duplex === "TDD" ? entry.tdd : entry.fdd) ?? NTM_UNKNOWN;
}

function getNrDesignation(bandValue: number | null | undefined, duplex: "FDD" | "TDD" | null | undefined): string | null {
  switch (bandValue) {
    case 700:
      return "n28";
    case 800:
      return "n20";
    case 900:
      return "n8";
    case 1800:
      return "n3";
    case 2100:
      return "n1";
    case 2600:
      return duplex === "TDD" ? "n41" : "n7";
    case 3500:
      return "n78";
    default:
      return null;
  }
}

function getNTMLocation(cell: CellExportData): string {
  const parts: string[] = [];
  const locationParts = [cell.city, cell.address].filter(Boolean).join(", ");
  if (locationParts) parts.push(locationParts);
  if (cell.notes) parts.push(cell.notes);
  return (parts.join(" - ") || cell.station_id).replace(/;/g, ",");
}

function getMlpBandCode(
  rat: "GSM" | "UMTS" | "LTE",
  bandValue: number | null | undefined,
  bandDuplex: "FDD" | "TDD" | null | undefined,
): string | null {
  if (!bandValue) return null;
  switch (rat) {
    case "GSM":
      return `G${bandValue}`;
    case "UMTS":
      return `U${bandValue}`;
    case "LTE":
      return `L${bandValue}${bandDuplex ?? ""}`;
  }
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
  const posRat = (cell.latitude != null && cell.longitude != null) ? -1 : 0;
  const description = getDescription(cell);

  return `${mccmnc};${cidHex};${lacHex};${rncHex};${lat};${lon};${posRat};${description};0`;
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
  const posRat = (cell.latitude != null && cell.longitude != null) ? -1 : 0;
  const description = getDescription(cell);

  return `${mccmnc};${cidDec};${lacDec};${rncDec};${lat};${lon};${posRat};${description};0`;
}

export function toCLF40(cell: CellExportData): string | null {
  const lac = cell.lac ?? cell.tac ?? cell.nrtac ?? 0;
  const cellId = getCellIdForExport(cell);
  if (!cellId) return null;

  const mccmnc = cell.operator_mnc;
  const cidFormatted = cellId.toString().padStart(5, "0");
  const lacFormatted = lac.toString().padStart(5, "0");
  const type = 0;
  const lat = cell.latitude ?? 0;
  const lon = cell.longitude ?? 0;
  const posRat = (cell.latitude != null && cell.longitude != null) ? -1 : 0;
  const description = getDescription(cell);
  const sys = getRatCode(cell.rat);
  const label = `${cell.station_id}_${cellId}`;
  const azi = 0;
  const height = 0;
  const hbw = 0;
  const vbw = 0;
  const tilt = 0;
  const loc = cell.station_id;

  return `${mccmnc};${cidFormatted};${lacFormatted};${type};${lat};${lon};${posRat};${description};${sys};${label};${azi};${height};${hbw};${vbw};${tilt};${loc}`;
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

  switch (cell.rat) {
    case "GSM": {
      const cid = cell.cid ?? NTM_UNKNOWN;
      const lac = cell.lac ?? NTM_UNKNOWN;
      let location = getNTMLocation(cell);
      const bandCode = getMlpBandCode("GSM", cell.band_value, cell.band_duplex);
      if (bandCode) location += ` [MLP:${cell.station_id}:${bandCode}]`;
      return `2G;${mcc};${mnc};${cid};${lac};${NTM_UNKNOWN};${NTM_UNKNOWN};${lat};${lon};${location};${NTM_UNKNOWN}`;
    }
    case "UMTS": {
      const cid = cell.cid ?? NTM_UNKNOWN;
      const lac = cell.lac ?? NTM_UNKNOWN;
      const rnc = cell.rnc ?? NTM_UNKNOWN;
      const uarfcn = cell.arfcn ?? NTM_UNKNOWN;
      let location = getNTMLocation(cell);
      const bandCode = getMlpBandCode("UMTS", cell.band_value, cell.band_duplex);
      if (bandCode) location += ` [MLP:${cell.station_id}:${rnc}:${bandCode}-${uarfcn}]`;
      return `3G;${mcc};${mnc};${cid};${lac};${rnc};${NTM_UNKNOWN};${lat};${lon};${location};${uarfcn}`;
    }
    case "LTE": {
      const ci = cell.clid ?? NTM_UNKNOWN;
      const tac = cell.tac ?? NTM_UNKNOWN;
      const enb = cell.enbid ?? NTM_UNKNOWN;
      const earfcn = getEarfcn(cell.operator_mnc, cell.band_value, cell.band_duplex);

      let location = getNTMLocation(cell);
      const bandCode = getMlpBandCode("LTE", cell.band_value, cell.band_duplex);
      if (bandCode) location += ` [MLP:${cell.station_id}:${bandCode}]`;
      if (cell.enbid != null && cell.clid != null) location += ` [eNBI:${cell.enbid} CLID:${cell.clid}]`;
      if (cell.nr_bands && cell.nr_bands.length > 0) {
        const nrDesignations = cell.nr_bands.map((b) => getNrDesignation(b.value, b.duplex)).filter((n): n is string => n !== null);
        const unique = [...new Set(nrDesignations)].sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
        if (unique.length > 0) location += ` [5G: ${unique.join("|")}]`;
      }

      return `4G;${mcc};${mnc};${ci};${tac};${enb};${NTM_UNKNOWN};${lat};${lon};${location};${earfcn}`;
    }
    case "NR": {
      const nci = cell.nci != null ? cell.nci : NTM_UNKNOWN;
      const tac = cell.nrtac ?? NTM_UNKNOWN;
      const nrDesig = getNrDesignation(cell.band_value, cell.band_duplex);

      let location = getNTMLocation(cell);
      if (nrDesig) location += ` [${nrDesig}]`;

      return `5G;${mcc};${mnc};${nci};${tac};;${NTM_UNKNOWN};${lat};${lon};${location};${NTM_UNKNOWN}`;
    }
    case "CDMA": {
      const bid = cell.cid ?? NTM_UNKNOWN;
      return `CD2;${mcc};${mnc};${bid};${NTM_UNKNOWN};;${NTM_UNKNOWN};${lat};${lon};${getNTMLocation(cell)};`;
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
