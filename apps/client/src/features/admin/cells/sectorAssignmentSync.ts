type SectorSyncCell = {
  _sectorLocalId?: string | null;
  details: object;
};

function hasSector(cell: SectorSyncCell): boolean {
  return cell._sectorLocalId !== undefined && cell._sectorLocalId !== null && cell._sectorLocalId !== "";
}

function getPCI(cell: SectorSyncCell): number | null {
  const details = cell.details as Record<string, unknown>;
  return typeof details.pci === "number" ? details.pci : null;
}

export function applyMissingSectorPCISync<T extends SectorSyncCell>(cells: T[]): T[] {
  const sectorsByPci = new Map<number, string>();
  for (const cell of cells) {
    if (!hasSector(cell)) continue;
    const pci = getPCI(cell);
    if (pci === null || sectorsByPci.has(pci)) continue;
    sectorsByPci.set(pci, cell._sectorLocalId);
  }

  if (sectorsByPci.size === 0) return cells;

  return cells.map((cell) => {
    if (hasSector(cell)) return cell;
    const pci = getPCI(cell);
    if (pci === null) return cell;
    const sectorLocalId = sectorsByPci.get(pci);
    if (sectorLocalId === undefined) return cell;
    return { ...cell, _sectorLocalId: sectorLocalId };
  });
}
