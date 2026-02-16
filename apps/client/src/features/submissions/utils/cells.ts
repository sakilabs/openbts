import { RAT_ORDER } from "@/features/shared/rat";
import type { ProposedCellForm, CellPayload, CellFormDetails } from "../types";

export function generateCellId(): string {
  return crypto.randomUUID();
}

function areDetailsEqual(a: Partial<CellFormDetails>, b: Partial<CellFormDetails>): boolean {
  const aRec = a as Record<string, unknown>;
  const bRec = b as Record<string, unknown>;
  const keysA = Object.keys(aRec).filter((k) => aRec[k] !== undefined);
  const keysB = Object.keys(bRec).filter((k) => bRec[k] !== undefined);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (aRec[key] !== bRec[key]) return false;
  }

  return true;
}

function isCellModified(current: ProposedCellForm, original: ProposedCellForm): boolean {
  return current.band_id !== original.band_id || current.notes !== original.notes || !areDetailsEqual(current.details, original.details);
}

function toCellPayload(cell: ProposedCellForm, operation: CellPayload["operation"]): CellPayload {
  return {
    operation,
    target_cell_id: cell.existingCellId,
    band_id: cell.band_id,
    rat: cell.rat,
    notes: cell.notes ?? null,
    details: cell.details,
  };
}

export function computeCellPayloads(originalCells: ProposedCellForm[], currentCells: ProposedCellForm[]): CellPayload[] {
  const payloads: CellPayload[] = [];

  const originalById = new Map<number, ProposedCellForm>();
  for (const cell of originalCells) {
    if (cell.existingCellId !== undefined) originalById.set(cell.existingCellId, cell);
  }

  const currentExistingIds = new Set<number>();
  for (const cell of currentCells) {
    if (cell.existingCellId !== undefined) currentExistingIds.add(cell.existingCellId);
  }

  for (const cell of currentCells) {
    if (cell.existingCellId === undefined) payloads.push(toCellPayload(cell, "added"));
    else {
      const original = originalById.get(cell.existingCellId);
      if (original && isCellModified(cell, original)) payloads.push(toCellPayload(cell, "updated"));
    }
  }

  for (const original of originalCells) {
    if (original.existingCellId !== undefined && !currentExistingIds.has(original.existingCellId)) payloads.push(toCellPayload(original, "removed"));
  }

  return payloads;
}

export function cellsToPayloads(cells: ProposedCellForm[]): CellPayload[] {
  return cells.map((cell) => toCellPayload(cell, "added"));
}

export type CellDiffStatus = "added" | "modified" | "unchanged";

export function buildOriginalCellsMap(originalCells: ProposedCellForm[]): Map<number, ProposedCellForm> {
  const map = new Map<number, ProposedCellForm>();
  for (const cell of originalCells) if (cell.existingCellId !== undefined) map.set(cell.existingCellId, cell);
  return map;
}

export function getCellDiffStatus(cell: ProposedCellForm, originalsMap: Map<number, ProposedCellForm>): CellDiffStatus {
  if (cell.existingCellId === undefined) return "added";

  const original = originalsMap.get(cell.existingCellId);
  if (!original) return "added";

  return isCellModified(cell, original) ? "modified" : "unchanged";
}

export function ukePermitsToCells(permits: { band_id: number; band?: { rat: string; id: number } | null }[]): ProposedCellForm[] {
  const seen = new Set<string>();
  const cells: ProposedCellForm[] = [];

  for (const permit of permits) {
    if (!permit.band || permit.band.rat === "IOT") continue;
    const key = `${permit.band.rat}-${permit.band.id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    cells.push({
      id: generateCellId(),
      rat: permit.band.rat as ProposedCellForm["rat"],
      band_id: permit.band.id,
      details: {},
    });
  }

  cells.sort((a, b) => RAT_ORDER.indexOf(a.rat) - RAT_ORDER.indexOf(b.rat));

  return cells;
}
