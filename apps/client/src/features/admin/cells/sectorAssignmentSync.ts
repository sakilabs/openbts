type SectorSyncCell = {
  _sectorLocalId?: string | null;
  details: object;
};

function getPCI(cell: SectorSyncCell): number | null {
  const details = cell.details as Record<string, unknown>;
  return typeof details.pci === "number" ? details.pci : null;
}

export function applySectorPatchWithPCISync<T extends SectorSyncCell>(
  cells: T[],
  targetId: string,
  patch: object & { _sectorLocalId?: string | null },
  getId: (cell: T) => string,
): T[] {
  if (!("_sectorLocalId" in patch)) return cells.map((cell) => (getId(cell) === targetId ? { ...cell, ...patch } : cell));

  const targetCell = cells.find((cell) => getId(cell) === targetId);
  if (!targetCell) return cells;

  const targetPci = getPCI(targetCell);
  if (targetPci === null) return cells.map((cell) => (getId(cell) === targetId ? { ...cell, ...patch } : cell));

  return cells.map((cell) => {
    if (getId(cell) === targetId) return { ...cell, ...patch };
    if (getPCI(cell) !== targetPci) return cell;
    return { ...cell, _sectorLocalId: patch._sectorLocalId };
  });
}
