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

type NRBandDef = { name: string; range: [number, number]; duplex?: string };
const NR_FREQ_TO_BANDS: Record<number, NRBandDef[]> = {
  700: [{ name: "n28", range: [151600, 160600] }],
  800: [{ name: "n20", range: [158200, 164166] }],
  900: [{ name: "n8", range: [185000, 192000] }],
  1800: [{ name: "n3", range: [361000, 376000] }],
  2100: [{ name: "n1", range: [422000, 434000] }],
  2600: [
    { name: "n7", range: [524000, 538000], duplex: "FDD" },
    { name: "n41", range: [499200, 537999], duplex: "TDD" },
  ],
  3500: [{ name: "n78", range: [620000, 653333] }],
};

type LTEFreqBandDef = { name: string; duplex?: string };
const LTE_FREQ_TO_BANDS: Record<number, LTEFreqBandDef[]> = {
  700: [{ name: "b28" }],
  800: [{ name: "b20" }],
  850: [{ name: "b5" }],
  900: [{ name: "b8" }],
  1800: [{ name: "b3" }],
  1900: [{ name: "b2" }],
  2100: [{ name: "b1" }],
  2600: [
    { name: "b7", duplex: "FDD" },
    { name: "b38", duplex: "TDD" },
  ],
  3500: [{ name: "b42" }],
  3600: [{ name: "b43" }],
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

export function getNRBandName(bandValue: number, duplex: string | null | undefined): string | null {
  const bands = NR_FREQ_TO_BANDS[bandValue];
  if (!bands) return null;
  return bands.find((b) => !b.duplex || b.duplex === duplex)?.name ?? null;
}

function calcNrFrequency(nrarfcn: number): number | null {
  for (const def of NR_GLOBAL) {
    if (nrarfcn >= def.range[0] && nrarfcn <= def.range[1]) return def.frefOffsHz + def.deltaFGlobal * (nrarfcn - def.nrefOffs);
  }
  return null;
}

export type FrequencyInfo = { frequency: string | null; bandName: string | null };

function getLTEBandName(bandValue: number, duplex: string | null | undefined): string | null {
  const bands = LTE_FREQ_TO_BANDS[bandValue];
  if (!bands) return null;
  return bands.find((b) => !b.duplex || b.duplex === duplex)?.name ?? null;
}

export function getBandName(rat: string, bandValue: number, duplex?: string | null): string | null {
  if (bandValue === 0) return null;
  switch (rat) {
    case "UMTS":
      return UMTS_BAND_NAMES[bandValue] ?? null;
    case "LTE":
      return getLTEBandName(bandValue, duplex);
    case "NR":
      return getNRBandName(bandValue, duplex);
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
      if (freq !== null) result = { freq, bandName: getNRBandName(bandValue, duplex) };
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
      const bandName = getLTEBandName(bandFreqValue, duplex);
      if (!bandName) return false;
      const bandDef = LTE_BANDS.find((b) => b.name === bandName);
      if (!bandDef) return false;
      return arfcn >= bandDef.range[0] && arfcn <= bandDef.range[1];
    }
    case "NR": {
      const nrBands = NR_FREQ_TO_BANDS[bandFreqValue];
      if (!nrBands) return NR_GLOBAL.some((def) => arfcn >= def.range[0] && arfcn <= def.range[1]);
      const candidates = duplex ? nrBands.filter((b) => !b.duplex || b.duplex === duplex) : nrBands;
      return candidates.some((b) => arfcn >= b.range[0] && arfcn <= b.range[1]);
    }
    default:
      return true;
  }
}
