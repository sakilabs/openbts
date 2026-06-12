import { Cancel01Icon, DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { memo, useCallback, useTransition } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SectorDraft } from "@/types/station";

type SectorRowProps = {
  sector: SectorDraft;
  index: number;
  onAzimuthChange: (localId: string, value: number | "") => void;
  onDelete: (localId: string) => void;
  readOnly?: boolean;
};

const SectorRow = memo(function SectorRow({ sector, index, onAzimuthChange, onDelete, readOnly }: SectorRowProps) {
  const handleAzimuthChange = useCallback(
    (el: React.ChangeEvent<HTMLInputElement>) => {
      const raw = el.target.value;
      if (raw === "") {
        onAzimuthChange(sector._localId, "");
        return;
      }
      const azimuth = Number.parseInt(raw, 10);
      if (!Number.isNaN(azimuth) && azimuth >= 0 && azimuth <= 359) onAzimuthChange(sector._localId, azimuth);
    },
    [sector._localId, onAzimuthChange],
  );

  const handleDelete = useCallback(() => onDelete(sector._localId), [sector._localId, onDelete]);

  return (
    <div className="flex items-center gap-2 py-1.5">
      {!readOnly ? <HugeiconsIcon icon={DragDropVerticalIcon} className="size-4 text-muted-foreground/50 cursor-grab shrink-0" /> : null}
      <span className="">S{index + 1}</span>
      <Input
        type="number"
        min={0}
        max={359}
        value={sector.azimuth}
        onChange={handleAzimuthChange}
        disabled={readOnly}
        className="w-20 h-7 text-sm tabular-nums"
        placeholder="0-359"
      />
      {!readOnly ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive shrink-0"
          onClick={handleDelete}
          type="button"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
        </Button>
      ) : null}
    </div>
  );
});

type SectorsEditorProps = {
  sectors: SectorDraft[];
  onChange: (sectors: SectorDraft[]) => void;
  derivedSectorCount: number;
  readOnly?: boolean;
};

let _sectorIdCounter = 0;
function newSectorLocalId() {
  return `sector-draft-${++_sectorIdCounter}`;
}

export function SectorsEditor({ sectors, onChange, derivedSectorCount, readOnly }: SectorsEditorProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const handleAzimuthChange = useCallback(
    (localId: string, value: number | "") => {
      startTransition(() => {
        onChange(sectors.map((sector) => (sector._localId === localId ? { ...sector, azimuth: value } : sector)));
      });
    },
    [sectors, onChange],
  );

  const handleDelete = useCallback(
    (localId: string) => {
      onChange(sectors.filter((sector) => sector._localId != localId));
    },
    [sectors, onChange],
  );

  const handleAdd = useCallback(() => {
    if (sectors.length === 15) return;
    onChange([...sectors, { _localId: newSectorLocalId(), azimuth: "" }]);
  }, [sectors, onChange]);

  return (
    <div className="space-y-4">
      {/* {derivedSectorCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          Sugerowana liczba sektorów
          <span className="font-semibold tabular-nums">{derivedSectorCount}</span>
        </p>
      ) : null}

      <div className="space-y-0.5">
        {sectors.length > 0 ? (
          <>
            <div className="grid grid-cols-[auto_auto_auto] gap-2 px-1 pb-1">
              <span className="text-xs text-muted-foreground col-start-2">Azymut</span>
            </div>
            {sectors.map((sector, i) => (
              <SectorRow
                key={sector._localId}
                sector={sector}
                index={i}
                onAzimuthChange={handleAzimuthChange}
                onDelete={handleDelete}
                readOnly={readOnly}
              />
            ))}
          </>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">Brak sektorów</p>
        )}
      </div>

      {!readOnly ? (
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={handleAdd} disabled={sectors.length >= 15}>
          <HugeiconsIcon icon={Add01Icon} className="size-3.5 mr-1.5" />
          Dodaj sektor
          <span className="ml-auto text-muted-foreground tabular-nums">{sectors.length}/15</span>
        </Button>
      ) : null} */}
    </div>
  );
}
