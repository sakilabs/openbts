export const getOperatorColor = (mnc: number): string => {
  switch (mnc) {
    case 26002:
      return "#E20074"; // T-Mobile - Magenta
    case 26003:
      return "#FF7900"; // Orange
    case 26001:
      return "#00B140"; // Plus - Green
    case 26006:
      return "#8B00FF"; // Play - Purple
    case 26034:
      return "#990A33"; // NetWorkS! - Dark Red
    case 26015:
    case 26016:
    case 26017:
      return "#255CAA"; // Aero2 - Dark Blue
    default:
      return "#3b82f6"; // blue
  }
};

const OPERATOR_NAME_TO_MNC: Record<string, number> = {
  orange: 26003,
  "orange polska": 26003,
  "t-mobile": 26002,
  "t-mobile polska": 26002,
  polkomtel: 26001,
  plus: 26001,
  "towerlink poland": 26001,
  p4: 26006,
  play: 26006,
  "networks!": 26034,
  aero2: 26016,
};

export function resolveOperatorMnc(mnc?: number | null, name?: string | null): number | null {
  if (mnc) return mnc;
  if (!name) return null;
  return OPERATOR_NAME_TO_MNC[name.toLowerCase().trim()] ?? null;
}

export function normalizeOperatorName(name: string): string {
  return name
    .toLowerCase()
    .split(/(\s+|-)/g)
    .map((part) => (/\s|-/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}

export const TOP4_MNCS = [26001, 26002, 26003, 26006]; // Plus, T-Mobile, Orange, Play

export function getOperatorSortIndex(mnc: number | null | undefined): number {
  if (mnc == null) return TOP4_MNCS.length;
  const idx = TOP4_MNCS.indexOf(mnc);
  return idx === -1 ? TOP4_MNCS.length : idx;
}
