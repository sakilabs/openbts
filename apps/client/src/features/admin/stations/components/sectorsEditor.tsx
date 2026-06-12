import { Add01Icon, ArrowDown01Icon, Cancel01Icon, DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ChangeEvent, type ReactNode, memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SectorDraft } from "@/types/station";

type SectorRowProps = {
  sector: SectorDraft;
  index: number;
  onAzimuthChange: (localId: string, value: number | "") => void;
  onDelete: (localId: string) => void;
  readOnly?: boolean;
  deleteDisabled?: boolean;
  previousAzimuth?: number;
  renderPreviousAzimuth?: (azimuth: number) => ReactNode;
};

const SectorRow = memo(function SectorRow({
  sector,
  index,
  onAzimuthChange,
  onDelete,
  readOnly,
  deleteDisabled,
  previousAzimuth,
  renderPreviousAzimuth,
}: SectorRowProps) {
  const handleAzimuthChange = useCallback(
    (el: ChangeEvent<HTMLInputElement>) => {
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
      <span className="w-7 text-sm font-medium tabular-nums">S{index + 1}</span>
      <div className="space-y-1">
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
        {previousAzimuth !== undefined && previousAzimuth !== sector.azimuth ? (renderPreviousAzimuth?.(previousAzimuth) ?? null) : null}
      </div>
      <span className="text-xs text-muted-foreground">°</span>
      {!readOnly ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive shrink-0"
          onClick={handleDelete}
          type="button"
          disabled={deleteDisabled}
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
        </Button>
      ) : null}
    </div>
  );
});

const COMPASS_CENTER = 64;
const COMPASS_LINE_RADIUS = 48;
const COMPASS_SECTOR_RADIUS = COMPASS_CENTER;
const COMPASS_LABEL_RADIUS = Math.round(COMPASS_LINE_RADIUS * 0.6);

const COMPASS_HALF_ANGLE = 20;

function getCompassPoint(azimuth: number, radius: number) {
  const radians = (azimuth * Math.PI) / 180;
  return {
    x: COMPASS_CENTER + Math.sin(radians) * radius,
    y: COMPASS_CENTER - Math.cos(radians) * radius,
  };
}

function getSectorPath(azimuth: number) {
  const left = getCompassPoint(azimuth - COMPASS_HALF_ANGLE, COMPASS_SECTOR_RADIUS);
  const right = getCompassPoint(azimuth + COMPASS_HALF_ANGLE, COMPASS_SECTOR_RADIUS);
  return `M ${COMPASS_CENTER} ${COMPASS_CENTER} L ${left.x} ${left.y} A ${COMPASS_SECTOR_RADIUS} ${COMPASS_SECTOR_RADIUS} 0 0 1 ${right.x} ${right.y} Z`;
}

function SectorCompass({ sectors }: { sectors: SectorDraft[] }) {
  const validSectors = sectors.flatMap((sector) =>
    typeof sector.azimuth === "number" ? [{ azimuth: sector.azimuth, localId: sector._localId }] : [],
  );

  return (
    <div className="relative size-32 rounded-full border bg-muted/20 mx-auto shadow-inner">
      <div className="absolute inset-3 rounded-full border border-dashed border-border" />
      <svg className="absolute inset-0 size-full overflow-visible text-primary" viewBox="0 0 128 128" aria-hidden="true">
        {validSectors.map((sector) => {
          const label = getCompassPoint(sector.azimuth, COMPASS_LABEL_RADIUS);
          return (
            <g key={sector.localId}>
              <path
                d={getSectorPath(sector.azimuth)}
                fill="currentColor"
                fillOpacity={0.25}
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
              <text
                x={label.x}
                y={label.y}
                fill="currentColor"
                stroke="hsl(var(--background))"
                strokeWidth={3}
                paintOrder="stroke"
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {sector.azimuth}°
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-sm" />
      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground">N</span>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">S</span>
      <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">W</span>
      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">E</span>
    </div>
  );
}

type SectorsEditorProps = {
  sectors: SectorDraft[];
  onChange: (sectors: SectorDraft[]) => void;
  derivedSectorCount: number;
  readOnly?: boolean;
  assignedSectorLocalIds?: ReadonlySet<string>;
  previousAzimuthByLocalId?: ReadonlyMap<string, number>;
  renderPreviousAzimuth?: (azimuth: number) => ReactNode;
};

let _sectorIdCounter = 0;
function newSectorLocalId() {
  return `sector-draft-${++_sectorIdCounter}`;
}

export function SectorsEditor({
  sectors,
  onChange,
  derivedSectorCount,
  readOnly,
  assignedSectorLocalIds,
  previousAzimuthByLocalId,
  renderPreviousAzimuth,
}: SectorsEditorProps) {
  const { t } = useTranslation(["stationDetails", "submissions"]);
  const maxSectors = derivedSectorCount;

  const handleAzimuthChange = useCallback(
    (localId: string, value: number | "") => {
      onChange(sectors.map((sector) => (sector._localId === localId ? { ...sector, azimuth: value } : sector)));
    },
    [sectors, onChange],
  );

  const handleDelete = useCallback(
    (localId: string) => {
      if (assignedSectorLocalIds?.has(localId)) return;
      onChange(sectors.filter((sector) => sector._localId !== localId));
    },
    [assignedSectorLocalIds, sectors, onChange],
  );

  const handleAdd = useCallback(() => {
    if (sectors.length >= maxSectors) return;
    onChange([...sectors, { _localId: newSectorLocalId(), azimuth: "" }]);
  }, [maxSectors, sectors, onChange]);

  return (
    <div className="space-y-4">
      {derivedSectorCount > 0 ? (
        <div className="mx-4 rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          {t("sectors.suggestedCount")} <span className="font-semibold tabular-nums text-foreground">{derivedSectorCount}</span>
        </div>
      ) : null}

      <div className={cn("grid gap-4 px-4", sectors.length > 0 && "sm:grid-cols-[auto_1fr]")}>
        {sectors.length > 0 ? <SectorCompass sectors={sectors} /> : null}
        <div className="space-y-0.5">
          {sectors.length > 0 ? (
            <>
              <div className="px-1 pb-1 text-xs text-muted-foreground">{t("sectors.azimuth")}</div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-x-4 gap-y-0.5">
                {sectors.map((sector, i) => (
                  <SectorRow
                    key={sector._localId}
                    sector={sector}
                    index={i}
                    onAzimuthChange={handleAzimuthChange}
                    onDelete={handleDelete}
                    readOnly={readOnly}
                    deleteDisabled={assignedSectorLocalIds?.has(sector._localId)}
                    previousAzimuth={previousAzimuthByLocalId?.get(sector._localId)}
                    renderPreviousAzimuth={renderPreviousAzimuth}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
              {t("sectors.empty")}
            </div>
          )}
        </div>
      </div>

      {!readOnly ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mx-4 mb-4 h-8 text-xs"
          onClick={handleAdd}
          disabled={sectors.length >= maxSectors}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-3.5 mr-1.5" />
          {t("sectors.add")}
          <span className="ml-auto text-muted-foreground tabular-nums">
            {sectors.length}/{maxSectors}
          </span>
        </Button>
      ) : null}
    </div>
  );
}

type SectorsPanelProps = SectorsEditorProps & {
  className?: string;
  defaultOpen?: boolean;
};

export function SectorsPanel({ className, defaultOpen, sectors, derivedSectorCount, ...editorProps }: SectorsPanelProps) {
  const { t } = useTranslation("stationDetails");

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <div className={cn("border rounded-xl overflow-hidden", className)}>
        <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer select-none group">
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              className="size-3.5 text-muted-foreground transition-transform group-data-panel-open:rotate-0 -rotate-90"
            />
            <span className="font-semibold text-sm">{t("tabs.sectors")}</span>
          </CollapsibleTrigger>
          <span className="text-xs text-muted-foreground">
            {sectors.length}/{derivedSectorCount}
          </span>
        </div>
        <CollapsibleContent className="pt-2">
          <SectorsEditor sectors={sectors} derivedSectorCount={derivedSectorCount} {...editorProps} />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
