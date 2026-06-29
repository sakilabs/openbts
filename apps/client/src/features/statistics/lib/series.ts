import { getOperatorColor, getOperatorColorByName, getOperatorSortIndex, resolveOperatorMnc } from "@openbts/shared/operatorUtils";

import type { Series } from "../components/statChart";

export interface OperatorSeriesItem {
  id: number;
  name: string;
  mnc?: number | null;
}

interface OperatorSeriesEntry {
  series: Series;
  sortMnc: number | null;
}

export function operatorDataKey(operator: OperatorSeriesItem): string {
  return `operator-${operator.id}`;
}

export function operatorColor(operator: OperatorSeriesItem): string {
  const mnc = resolveOperatorMnc(operator.mnc, operator.name);
  return mnc !== null ? getOperatorColor(mnc) : getOperatorColorByName(operator.name);
}

export function operatorSeries(operators: Iterable<OperatorSeriesItem>): Series[] {
  const seen = new Map<number, OperatorSeriesEntry>();

  for (const operator of operators) {
    if (seen.has(operator.id)) continue;
    const mnc = resolveOperatorMnc(operator.mnc, operator.name);
    seen.set(operator.id, {
      series: {
        key: operatorDataKey(operator),
        label: operator.name,
        color: mnc !== null ? getOperatorColor(mnc) : getOperatorColorByName(operator.name),
      },
      sortMnc: mnc,
    });
  }

  return [...seen.values()]
    .sort((a, b) => getOperatorSortIndex(a.sortMnc) - getOperatorSortIndex(b.sortMnc) || a.series.label.localeCompare(b.series.label))
    .map((entry) => entry.series);
}
