import type { Cell } from "@/types/station";

export function groupCellsByRat(cells: Cell[]): Record<string, Cell[]> {
	return cells.reduce<Record<string, Cell[]>>((groups, cell) => {
		groups[cell.rat] ??= [];
		groups[cell.rat].push(cell);
		return groups;
	}, {});
}
