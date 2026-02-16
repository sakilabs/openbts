import type { Cell } from "@/types/station";
import { RAT_ICONS } from "@/features/shared/rat";

export { RAT_ICONS };

export function groupCellsByRat(cells: Cell[]): Record<string, Cell[]> {
  const groups = cells.reduce<Record<string, Cell[]>>((acc, cell) => {
    acc[cell.rat] ??= [];
    acc[cell.rat].push(cell);
    return acc;
  }, {});

  for (const rat in groups) {
    groups[rat].sort((a, b) => {
      const bandA = Number(a.band.value);
      const bandB = Number(b.band.value);
      if (bandA !== bandB) return bandA - bandB;

      switch (rat) {
        case "GSM":
          return (a.details?.cid ?? 0) - (b.details?.cid ?? 0);
        case "UMTS":
          return (a.details?.cid_long ?? 0) - (b.details?.cid_long ?? 0);
        case "LTE":
          return (a.details?.ecid ?? 0) - (b.details?.ecid ?? 0);
        case "NR":
          return (a.details?.nci ?? 0) - (b.details?.nci ?? 0);
        default:
          return 0;
      }
    });
  }

  return groups;
}
