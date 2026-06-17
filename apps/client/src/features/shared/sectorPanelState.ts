type SectorPanelCell = {
  band_id: number | null;
  _sectorLocalId?: string | null;
};

export function deriveSectorPanelState(cells: readonly SectorPanelCell[]) {
  const bandCounts = new Map<number, number>();
  for (const cell of cells) {
    if (cell.band_id === null) continue;
    bandCounts.set(cell.band_id, (bandCounts.get(cell.band_id) ?? 0) + 1);
  }

  const derivedSectorCount = bandCounts.size > 0 ? Math.max(...bandCounts.values()) : 0;
  const assignedSectorLocalIds = new Set(cells.flatMap((cell) => (cell._sectorLocalId ? [cell._sectorLocalId] : [])));

  return { derivedSectorCount, assignedSectorLocalIds };
}
