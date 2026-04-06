type UMTSBandDef = { name: string; range: [number, number]; offset: number };
const UMTS_BAND_DEFS: UMTSBandDef[] = [
  { name: "Band I", range: [10562, 10838], offset: 0 },
  { name: "Band II", range: [9662, 9938], offset: 0 },
  { name: "Band III", range: [1162, 1513], offset: 1735 },
  { name: "Band IV", range: [4357, 4458], offset: 1805 },
  { name: "Band V", range: [4132, 4233], offset: 0 },
  { name: "Band VI", range: [4387, 4413], offset: 0 },
  { name: "Band VIII", range: [2937, 3088], offset: 0 },
];

function calcUmtsFrequency(uarfcn: number): { freq: number; bandName: string } | null {
  for (const def of UMTS_BAND_DEFS) {
    if (uarfcn >= def.range[0] && uarfcn <= def.range[1]) return { freq: def.offset + 0.2 * uarfcn, bandName: def.name };
  }
  return null;
}

type LTEBandDef = { name: string; fdlLow: number; noffsDl: number; range: [number, number] };
const LTE_BANDS: LTEBandDef[] = [
  { name: "b1", fdlLow: 2110, noffsDl: 0, range: [0, 599] },
  { name: "b2", fdlLow: 1930, noffsDl: 600, range: [600, 1199] },
  { name: "b3", fdlLow: 1805, noffsDl: 1200, range: [1200, 1949] },
  { name: "b4", fdlLow: 2110, noffsDl: 1950, range: [1950, 2399] },
  { name: "b5", fdlLow: 869, noffsDl: 2400, range: [2400, 2649] },
  { name: "b6", fdlLow: 875, noffsDl: 2650, range: [2650, 2749] },
  { name: "b7", fdlLow: 2620, noffsDl: 2750, range: [2750, 3449] },
  { name: "b8", fdlLow: 925, noffsDl: 3450, range: [3450, 3799] },
  { name: "b9", fdlLow: 1844.9, noffsDl: 3800, range: [3800, 4149] },
  { name: "b20", fdlLow: 791, noffsDl: 6150, range: [6150, 6449] },
  { name: "b28", fdlLow: 758, noffsDl: 9210, range: [9210, 9659] },
  { name: "b38", fdlLow: 2570, noffsDl: 37750, range: [37750, 38249] },
  { name: "b40", fdlLow: 1880, noffsDl: 38650, range: [38650, 39649] },
  { name: "b41", fdlLow: 2496, noffsDl: 41590, range: [41590, 43589] },
  { name: "b42", fdlLow: 3510, noffsDl: 42590, range: [42590, 43589] },
  { name: "b43", fdlLow: 3600, noffsDl: 43590, range: [43590, 45589] },
];

function calcLteFrequency(earfcn: number): { freq: number; bandName: string } | null {
  for (const band of LTE_BANDS) {
    if (earfcn >= band.range[0] && earfcn <= band.range[1]) return { freq: band.fdlLow + 0.1 * (earfcn - band.noffsDl), bandName: band.name };
  }
  return null;
}

type NRGlobalDef = { frefOffsHz: number; deltaFGlobal: number; nrefOffs: number; range: [number, number] };
const NR_GLOBAL: NRGlobalDef[] = [
  { frefOffsHz: 0, deltaFGlobal: 0.005, nrefOffs: 0, range: [0, 599999] },
  { frefOffsHz: 3000, deltaFGlobal: 0.015, nrefOffs: 600000, range: [600000, 2016666] },
  { frefOffsHz: 24250.08, deltaFGlobal: 0.06, nrefOffs: 2016667, range: [2016667, 3279165] },
];

export const LTE_BAND_NAMES: Record<number, string> = {
  700: "b28",
  800: "b20",
  850: "b5",
  900: "b8",
  1800: "b3",
  1900: "b2",
  2100: "b1",
  2600: "b7",
  3500: "b42",
  3600: "b43",
};

export const UMTS_BAND_NAMES: Record<number, string> = {
  800: "Band VI",
  850: "Band V",
  900: "Band VIII",
  1700: "Band IV",
  1800: "Band III",
  1900: "Band II",
  2100: "Band I",
};

export function getNrBandName(bandValue: number, duplex: string | null | undefined): string | null {
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

function calcNrFrequency(nrarfcn: number): number | null {
  for (const def of NR_GLOBAL) {
    if (nrarfcn >= def.range[0] && nrarfcn <= def.range[1]) return def.frefOffsHz + def.deltaFGlobal * (nrarfcn - def.nrefOffs);
  }
  return null;
}

export type FrequencyInfo = { frequency: string | null; bandName: string | null };

export function getBandName(rat: string, bandValue: number, duplex?: string | null): string | null {
  if (bandValue === 0) return null;
  switch (rat) {
    case "UMTS":
      return UMTS_BAND_NAMES[bandValue] ?? null;
    case "LTE":
      return LTE_BAND_NAMES[bandValue] ?? null;
    case "NR":
      return getNrBandName(bandValue, duplex);
    default:
      return null;
  }
}

export function calcExactFrequency(rat: string, bandValue: number, arfcn: number | null | undefined, duplex?: string | null): FrequencyInfo | null {
  if (arfcn === null || arfcn === undefined || bandValue === 0) return null;

  let result: { freq: number; bandName: string | null } | null = null;
  switch (rat) {
    case "UMTS":
      result = calcUmtsFrequency(arfcn);
      break;
    case "LTE":
      result = calcLteFrequency(arfcn);
      break;
    case "NR": {
      const freq = calcNrFrequency(arfcn);
      if (freq !== null) result = { freq, bandName: getNrBandName(bandValue, duplex) };
      break;
    }
    default:
      return null;
  }

  if (result === null) return null;

  const { freq, bandName } = result;
  const formatted = freq % 1 === 0 ? `${freq}.0` : freq.toFixed(2).replace(/0+$/, "");
  return { frequency: `${formatted} MHz`, bandName };
}

/**
 * Validates that the given ARFCN falls within the expected range for the specified band
 * @param rat - "UMTS", "LTE", "NR"
 * @param bandFreqValue - Band frequency value
 * @param arfcn - The ARFCN/EARFCN/NR-ARFCN to validate
 * @param duplex - "FDD" or "TDD" (required to distinguish e.g. B7 vs B38 at 2600 MHz)
 */
export function isARFCNValidForBand(rat: string, bandFreqValue: number, arfcn: number, duplex?: string | null): boolean {
  switch (rat) {
    case "UMTS": {
      const bandName = UMTS_BAND_NAMES[bandFreqValue];
      if (!bandName) return false;
      const bandDef = UMTS_BAND_DEFS.find((d) => d.name === bandName);
      if (!bandDef) return false;
      return arfcn >= bandDef.range[0] && arfcn <= bandDef.range[1];
    }
    case "LTE": {
      let bandName = LTE_BAND_NAMES[bandFreqValue];
      if (bandFreqValue === 2600 && duplex === "TDD") bandName = "b38";
      if (!bandName) return false;
      const bandDef = LTE_BANDS.find((b) => b.name === bandName);
      if (!bandDef) return false;
      return arfcn >= bandDef.range[0] && arfcn <= bandDef.range[1];
    }
    case "NR":
      return NR_GLOBAL.some((def) => arfcn >= def.range[0] && arfcn <= def.range[1]);
    default:
      return true;
  }
}
