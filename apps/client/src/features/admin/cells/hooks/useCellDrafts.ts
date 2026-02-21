import { useState, useMemo, useCallback, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { RAT_ORDER, getSharedDetailFields } from "../rat";
import type { CellDraftBase } from "../cellEditRow";
import type { Band } from "@/types/station";

type UseCellDraftsOptions<T extends CellDraftBase> = {
  initialCells: T[];
  initialEnabledRats?: string[];
  allBands: Band[];
  createNewCell: (rat: string, defaultBand: Band) => T;
  onDelete?: (cell: T) => void;
  disabled?: boolean;
};

type UseCellDraftsReturn<T extends CellDraftBase> = {
  cells: T[];
  setCells: Dispatch<SetStateAction<T[]>>;
  cellsByRat: Record<string, T[]>;
  enabledRats: string[];
  setEnabledRats: Dispatch<SetStateAction<string[]>>;
  visibleRats: string[];
  toggleRat: (rat: string) => void;
  changeCell: (localId: string, patch: Partial<CellDraftBase>) => void;
  addCell: (rat: string) => void;
  deleteCell: (localId: string) => void;
};

export function useCellDrafts<T extends CellDraftBase>({
  initialCells,
  initialEnabledRats,
  allBands,
  createNewCell,
  onDelete,
  disabled,
}: UseCellDraftsOptions<T>): UseCellDraftsReturn<T> {
  const { t } = useTranslation("stations");

  const [cells, setCells] = useState<T[]>(initialCells);
  const [enabledRats, setEnabledRats] = useState<string[]>(
    () => initialEnabledRats ?? RAT_ORDER.filter((r) => initialCells.some((c) => c.rat === r)),
  );

  const bandValueMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const b of allBands) map.set(b.id, b.value);
    return map;
  }, [allBands]);

  const cellsByRat = useMemo(() => {
    const grouped: Record<string, T[]> = {};
    for (const cell of cells) {
      if (!grouped[cell.rat]) grouped[cell.rat] = [];
      grouped[cell.rat].push(cell);
    }
    for (const rat of Object.keys(grouped)) {
      grouped[rat].sort((a, b) => {
        const bandA = bandValueMap.get(a.band_id) ?? 0;
        const bandB = bandValueMap.get(b.band_id) ?? 0;
        if (bandA !== bandB) return bandA - bandB;
        const clidKey = rat === "GSM" || rat === "UMTS" ? "cid" : "clid";
        const clidA = (a.details[clidKey] as number) ?? 0;
        const clidB = (b.details[clidKey] as number) ?? 0;
        return clidA - clidB;
      });
    }
    return grouped;
  }, [cells, bandValueMap]);

  const visibleRats = useMemo(() => RAT_ORDER.filter((r) => enabledRats.includes(r)), [enabledRats]);

  const toggleRat = useCallback((rat: string) => {
    setEnabledRats((prev) => (prev.includes(rat) ? prev.filter((r) => r !== rat) : [...prev, rat]));
  }, []);

  const changeCell = useCallback(
    (localId: string, patch: Partial<CellDraftBase>) => {
      if (disabled) return;
      setCells((prev) => prev.map((c) => (c._localId === localId ? { ...c, ...patch } : c)));
    },
    [disabled],
  );

  const addCell = useCallback(
    (rat: string) => {
      if (disabled) return;
      const bandsForRat = allBands.filter((b) => b.rat === rat);
      if (bandsForRat.length === 0) {
        toast.error(t("toast.noBands", { rat }));
        return;
      }
      setCells((prev) => {
        const newCell = createNewCell(rat, bandsForRat[0]);
        const existingSibling = prev.find((c) => c.rat === rat);
        if (existingSibling) {
          const sharedFields = getSharedDetailFields(rat);
          const inherited: Record<string, unknown> = {};
          for (const field of sharedFields) {
            if (existingSibling.details[field] !== undefined) inherited[field] = existingSibling.details[field];
          }
          if (Object.keys(inherited).length > 0) newCell.details = { ...newCell.details, ...inherited };
        }
        return [...prev, newCell];
      });
    },
    [disabled, allBands, createNewCell, t],
  );

  const deleteCellFn = useCallback(
    (localId: string) => {
      if (disabled) return;
      setCells((prev) => {
        const cell = prev.find((c) => c._localId === localId);
        if (cell && onDelete) onDelete(cell);
        return prev.filter((c) => c._localId !== localId);
      });
    },
    [disabled, onDelete],
  );

  return {
    cells,
    setCells,
    cellsByRat,
    enabledRats,
    setEnabledRats,
    visibleRats,
    toggleRat,
    changeCell,
    addCell,
    deleteCell: deleteCellFn,
  };
}
