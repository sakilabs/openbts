const BAND_ORDER = [
  "GSM900",
  "GSM1800",
  "UMTS900",
  "UMTS2100",
  "LTE700",
  "LTE800",
  "LTE900",
  "LTE1800",
  "LTE2100",
  "LTE2600",
  "NR700",
  "NR900",
  "NR1800",
  "NR2100",
  "NR2600",
  "NR3600",
  "GSM-R900",
  "IOT900",
  "LTE420",
  "LTE450",
] as const;

const BAND_ORDER_INDEX = new Map(BAND_ORDER.map((band, index) => [band, index]));

export function compareBandNames(a: string, b: string): number {
  const orderA = BAND_ORDER_INDEX.get(a) ?? Number.MAX_SAFE_INTEGER;
  const orderB = BAND_ORDER_INDEX.get(b) ?? Number.MAX_SAFE_INTEGER;
  return orderA - orderB || a.localeCompare(b, undefined, { numeric: true });
}
