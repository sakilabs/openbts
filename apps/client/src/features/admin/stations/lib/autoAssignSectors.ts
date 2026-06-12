import type { SectorDraft } from "@/types/station";

import type { CellDraftBase } from "../../cells/cellEditRow";

type CellWithSectorLocalId = CellDraftBase & { _sectorLocalId?: string | null };

/**
 * Assign cells to sectors by their position within each band.
 * Cell with index 0 within first band, will be 1st sector, index 1 is 2nd sector and so on
 */
export function autoAssignSectors(cells: CellWithSectorLocalId[], sectors: SectorDraft[]) {
  if (sectors.length === 0) return cells;

  const byBand = new Map<number, CellWithSectorLocalId[]>();
  for (const cell of cells) {
    const existing = byBand.get(cell.band_id);
    if (existing) existing.push(cell);
    else byBand.set(cell.band_id, [cell]);
  }

  const assignments = new Map<string, string | null>();
  for (const group of byBand.values()) {
    for (let i = 0; i < group.length; i++) {
      const sector = sectors[i];
      assignments.set(group[i]._localId, sector?._localId ?? null);
    }
  }

  return cells.map((cell) => (assignments.has(cell._localId) ? { ...cell, _sectorLocalId: assignments.get(cell._localId) } : cell));
}
