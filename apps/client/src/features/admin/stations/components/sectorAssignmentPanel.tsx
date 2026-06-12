import { memo, useCallback, useMemo, useTransition } from "react";

import type { Band, SectorDraft } from "@/types/station";

import type { CellDraftBase } from "../../cells/cellEditRow";

type CellWithSectorLocalId = CellDraftBase & { _sectorLocalId?: string | null };

type CellPillProps = {
  cell: CellWithSectorLocalId;
  sectors: SectorDraft[];
  bands: Band[];
  onAssign: (localId: string, sectorLocalId: string | null) => void;
};

const CellPill = memo(function CellPill({ cell, sectors, bands, onAssign }: CellPillProps) {
  return <></>;
});

type SectorAssignmentPanelProps = {
  sectors: SectorDraft[];
  cells: CellWithSectorLocalId[];
  bands: Band[];
  onCellSectorChange: (cellLocalId: string, sectorLocalId: string | null) => void;
  onAutoAssign: () => void;
};

export function SectorAssignmentPanel({ sectors, cells, bands, onCellSectorChange, onAutoAssign }: SectorAssignmentPanelProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const handleAutoAssign = useCallback(() => {
    startTransition(() => onAutoAssign());
  }, [onAutoAssign]);

  const { buckets, unassigned } = useMemo(() => {
    const buckets = new Map<string, CellWithSectorLocalId[]>(sectors.map((sector) => [sector._localId, []]));
    const unassigned: CellWithSectorLocalId[] = [];

    for (const cell of cells) {
      const list = cell._sectorLocalId ? buckets.get(cell._sectorLocalId) : null;
      if (list) list.push(cell);
      else unassigned.push(cell);
    }

    return { buckets, unassigned };
  }, [sectors, cells]);

  if (sectors.length === 0) return null;
}
