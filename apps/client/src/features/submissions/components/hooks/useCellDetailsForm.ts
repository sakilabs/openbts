import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { bandsQueryOptions } from "@/features/shared/queries";
import { getSharedDetailFields } from "@/features/shared/rat";
import { generateCellId, getCellDiffStatus, buildOriginalCellsMap } from "../../utils/cells";
import type { RatType, ProposedCellForm, GSMCellDetails, UMTSCellDetails, LTECellDetails, NRCellDetails } from "../../types";

function getDefaultCellDetails(rat: RatType): ProposedCellForm["details"] {
  switch (rat) {
    case "GSM":
      return {} as GSMCellDetails;
    case "UMTS":
      return {} as UMTSCellDetails;
    case "LTE":
      return {} as LTECellDetails;
    case "NR":
      return { type: "nsa" } as NRCellDetails;
  }
}

export type UseCellDetailsFormProps = {
  rat: RatType;
  cells: ProposedCellForm[];
  originalCells: ProposedCellForm[];
  isNewStation: boolean;
  onCellsChange: (rat: RatType, cells: ProposedCellForm[]) => void;
};

export function useCellDetailsForm({ rat, cells, originalCells, isNewStation, onCellsChange }: UseCellDetailsFormProps) {
  const { t } = useTranslation(["submissions", "admin"]);
  const { t: tStation } = useTranslation("stationDetails");

  const { data: allBands = [] } = useQuery(bandsQueryOptions());

  const bandsForRat = useMemo(() => allBands.filter((band) => band.rat === rat), [allBands, rat]);

  const bandValueMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const b of allBands) map.set(b.id, b.value);
    return map;
  }, [allBands]);

  const mergedCells = useMemo(() => {
    if (isNewStation) return cells;
    const currentExistingIds = new Set(cells.filter((c) => c.existingCellId !== undefined).map((c) => c.existingCellId));
    const deletedCells = originalCells.filter((c) => c.rat === rat && c.existingCellId !== undefined && !currentExistingIds.has(c.existingCellId));
    return [...cells, ...deletedCells];
  }, [cells, originalCells, isNewStation, rat]);

  const sortedCells = useMemo(() => {
    const clidKey = rat === "GSM" || rat === "UMTS" ? "cid" : "clid";
    return [...mergedCells].sort((a, b) => {
      const bandA = a.band_id !== null ? (bandValueMap.get(a.band_id) ?? 0) : 0;
      const bandB = b.band_id !== null ? (bandValueMap.get(b.band_id) ?? 0) : 0;
      if (bandA !== bandB) return bandA - bandB;
      const d = a.details as Record<string, unknown>;
      const e = b.details as Record<string, unknown>;
      const clidA = (d[clidKey] as number) ?? 0;
      const clidB = (e[clidKey] as number) ?? 0;
      return clidA - clidB;
    });
  }, [mergedCells, bandValueMap, rat]);

  const originalsMap = useMemo(() => buildOriginalCellsMap(originalCells), [originalCells]);

  const diffCounts = useMemo(() => {
    if (isNewStation) return { added: cells.length, modified: 0, deleted: 0 };
    let added = 0;
    let modified = 0;
    for (const cell of cells) {
      const status = getCellDiffStatus(cell, originalsMap);
      if (status === "added") added++;
      else if (status === "modified") modified++;
    }
    const currentExistingIds = new Set(cells.filter((c) => c.existingCellId !== undefined).map((c) => c.existingCellId));
    const deleted = originalCells.filter((c) => c.rat === rat && c.existingCellId !== undefined && !currentExistingIds.has(c.existingCellId)).length;
    return { added, modified, deleted };
  }, [cells, originalsMap, isNewStation, originalCells, rat]);

  const handleAddCell = useCallback(() => {
    const defaults = getDefaultCellDetails(rat);
    const existingSibling = cells[0] ?? originalCells.find((c) => c.rat === rat);
    if (existingSibling) {
      const sharedFields = getSharedDetailFields(rat);
      for (const field of sharedFields) {
        if ((existingSibling.details as Record<string, unknown>)[field] !== undefined)
          (defaults as Record<string, unknown>)[field] = (existingSibling.details as Record<string, unknown>)[field];
      }
    }
    const newCell: ProposedCellForm = {
      id: generateCellId(),
      rat,
      band_id: null,
      details: defaults,
    };
    onCellsChange(rat, [...cells, newCell]);
  }, [cells, originalCells, rat, onCellsChange]);

  const [clonedIds, setClonedIds] = useState<ReadonlySet<string>>(new Set());
  const cloneTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(
    () => () => {
      for (const t of cloneTimers.current.values()) clearTimeout(t);
    },
    [],
  );

  const handleCloneCell = useCallback(
    (id: string) => {
      const cell = cells.find((c) => c.id === id);
      if (!cell) return;
      const newId = generateCellId();
      const cloned: ProposedCellForm = { ...cell, id: newId, existingCellId: undefined };
      const idx = cells.findIndex((c) => c.id === id);
      const next = [...cells];
      next.splice(idx + 1, 0, cloned);
      onCellsChange(rat, next);
      setClonedIds((prev) => new Set([...prev, newId]));
      const timer = setTimeout(() => {
        setClonedIds((prev) => {
          const s = new Set(prev);
          s.delete(newId);
          return s;
        });
        cloneTimers.current.delete(newId);
      }, 2000);
      cloneTimers.current.set(newId, timer);
    },
    [cells, onCellsChange, rat],
  );

  const handleRemoveCell = useCallback(
    (id: string) => {
      onCellsChange(
        rat,
        cells.filter((cell) => cell.id !== id),
      );
    },
    [cells, onCellsChange, rat],
  );

  const handleRestoreCell = useCallback(
    (cell: ProposedCellForm) => {
      onCellsChange(rat, [...cells, cell]);
    },
    [cells, onCellsChange, rat],
  );

  const handleCellUpdate = useCallback(
    (cellId: string, patch: Partial<ProposedCellForm>) => {
      onCellsChange(
        rat,
        cells.map((cell) => (cell.id === cellId ? { ...cell, ...patch } : cell)),
      );
    },
    [cells, onCellsChange, rat],
  );

  const handleDetailsChange = useCallback(
    (id: string, field: string, value: number | boolean | string | undefined) => {
      onCellsChange(
        rat,
        cells.map((cell) => {
          if (cell.id !== id) return cell;
          const newDetails = { ...cell.details } as Record<string, unknown>;
          if (value === undefined) delete newDetails[field];
          else newDetails[field] = value;
          return { ...cell, details: newDetails as ProposedCellForm["details"] };
        }),
      );
    },
    [cells, onCellsChange, rat],
  );

  const handleNotesChange = useCallback(
    (id: string, notes: string) => {
      onCellsChange(
        rat,
        cells.map((cell) => (cell.id === id ? { ...cell, notes: notes || undefined } : cell)),
      );
    },
    [cells, onCellsChange, rat],
  );

  return {
    t,
    tStation,
    bandsForRat,
    sortedCells,
    originalsMap,
    diffCounts,
    isNewStation,
    handleAddCell,
    handleCloneCell,
    clonedIds,
    handleRemoveCell,
    handleRestoreCell,
    handleCellUpdate,
    handleDetailsChange,
    handleNotesChange,
  };
}
