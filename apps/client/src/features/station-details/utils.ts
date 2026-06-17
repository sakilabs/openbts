import { RAT_ICONS, getRatSortDetailField } from "@/features/shared/rat";
import type { Cell } from "@/types/station";

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

      const sortField = getRatSortDetailField(rat);
      const valueA = sortField ? ((a.details?.[sortField as keyof typeof a.details] as number) ?? 0) : 0;
      const valueB = sortField ? ((b.details?.[sortField as keyof typeof b.details] as number) ?? 0) : 0;
      return valueA - valueB;
    });
  }

  return groups;
}
