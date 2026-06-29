import { getOperatorColor, getOperatorSortIndex, resolveOperatorMnc } from "@openbts/shared/operatorUtils";

import type { Series } from "../components/statChart";

export function operatorSeries(names: Iterable<string>): Series[] {
  const seen = new Map<string, Series>();

  for (const name of names) {
    if (seen.has(name)) continue;
    const mnc = resolveOperatorMnc(null, name);
    seen.set(name, { key: name, label: name, color: mnc ? getOperatorColor(mnc) : "#00E1FF" });
  }

  return [...seen.values()].sort(
    (a, b) => getOperatorSortIndex(resolveOperatorMnc(null, a.key)) - getOperatorSortIndex(resolveOperatorMnc(null, b.key)),
  );
}
