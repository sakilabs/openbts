import { memo, useState, useEffect, useRef, useCallback } from "react";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, DeletePutBackIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getCellDiffStatus, type CellDiffStatus } from "../utils/cells";
import type { RatType, ProposedCellForm } from "../types";
import type { CellError } from "../utils/validation";
import type { Band } from "@/types/station";

import { CellDetailsFields } from "@/features/admin/cells/cellDetailsFields";
import { useBandSelection } from "@/features/admin/cells/hooks/useBandSelection";
import { useCellDetailsForm } from "./hooks/useCellDetailsForm";
import { CollapsibleHeader } from "./subcomponents/CollapsibleHeader";
import { CellsTableHeaders } from "./subcomponents/CellsTableHeaders";

type CellDetailsFormProps = {
  rat: RatType;
  cells: ProposedCellForm[];
  originalCells: ProposedCellForm[];
  isNewStation: boolean;
  cellErrors?: Record<string, CellError>;
  onCellsChange: (rat: RatType, cells: ProposedCellForm[]) => void;
};

export function CellDetailsForm({ rat, cells, originalCells, isNewStation, cellErrors, onCellsChange }: CellDetailsFormProps) {
  const scrollRef = useHorizontalScroll<HTMLDivElement>();
  const {
    t,
    tStation,
    bandsForRat,
    sortedCells,
    originalsMap,
    diffCounts,
    handleAddCell,
    handleRemoveCell,
    handleRestoreCell,
    handleCellUpdate,
    handleDetailsChange,
    handleNotesChange,
  } = useCellDetailsForm({ rat, cells, originalCells, isNewStation, onCellsChange });

  return (
    <Collapsible defaultOpen>
      <div className="border rounded-xl overflow-hidden">
        <CollapsibleHeader rat={rat} cellsCount={cells.length} diffCounts={diffCounts} onAddCell={handleAddCell} t={t} />
        <CollapsibleContent>
          {cells.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">{t("stations:cells.noCells")}</div>
          ) : (
            <div ref={scrollRef} className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <CellsTableHeaders rat={rat} tStation={tStation} />
                <tbody>
                  {sortedCells.map((cell) => {
                    const isDeleted =
                      !isNewStation && cell.existingCellId !== undefined && !cells.some((c) => c.existingCellId === cell.existingCellId);
                    const diffStatus: CellDiffStatus = isDeleted ? "deleted" : isNewStation ? "added" : getCellDiffStatus(cell, originalsMap);

                    return (
                      <CellRow
                        key={cell.id}
                        rat={rat}
                        cell={cell}
                        diffStatus={diffStatus}
                        error={cellErrors?.[cell.id]}
                        bands={bandsForRat}
                        onUpdate={handleCellUpdate}
                        onDetailsChange={handleDetailsChange}
                        onNotesChange={handleNotesChange}
                        onRemove={handleRemoveCell}
                        onRestore={isDeleted ? () => handleRestoreCell(cell) : undefined}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

type CellRowProps = {
  rat: RatType;
  cell: ProposedCellForm;
  diffStatus: CellDiffStatus;
  error?: CellError;
  bands: Band[];
  onUpdate: (id: string, patch: Partial<ProposedCellForm>) => void;
  onDetailsChange: (id: string, field: string, value: number | boolean | string | undefined) => void;
  onNotesChange: (id: string, notes: string) => void;
  onRemove: (id: string) => void;
  onRestore?: () => void;
};

const DebouncedNotesInput = memo(function DebouncedNotesInput({
  value,
  placeholder,
  disabled,
  onChange,
}: {
  value: string;
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  if (value !== prevValue) {
    setPrevValue(value);
    setLocal(value);
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChangeRef.current(v), 300);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return <Input type="text" placeholder={placeholder} value={local} onChange={handleChange} className="h-7 w-28 text-sm" disabled={disabled} />;
});

const CellRow = memo(function CellRow({
  rat,
  cell,
  diffStatus,
  error,
  bands,
  onUpdate,
  onDetailsChange,
  onNotesChange,
  onRemove,
  onRestore,
}: CellRowProps) {
  const { t } = useTranslation(["submissions", "common"]);

  const { uniqueBandValues, bandValue, duplex, duplexOptions, hasDuplexChoice, findBandId, bandsForRat } = useBandSelection(
    bands,
    rat,
    cell.band_id ?? -1,
  );

  const handleBandValueChange = useCallback(
    (value: number | null) => {
      const opts = value ? [...new Set(bandsForRat.filter((b) => b.value === value).map((b) => b.duplex))] : [];
      const defaultDuplex = opts.length === 1 ? opts[0] : null;
      const newBandId = findBandId(value, defaultDuplex);
      if (!newBandId) return;
      const patch: Partial<ProposedCellForm> = { band_id: newBandId };
      if (rat === "GSM" && value === 1800) patch.details = { ...cell.details, e_gsm: false } as ProposedCellForm["details"];
      onUpdate(cell.id, patch);
    },
    [bandsForRat, findBandId, rat, cell.id, cell.details, onUpdate],
  );

  const handleDuplexChange = useCallback(
    (dup: string | null) => {
      const newBandId = findBandId(bandValue, dup);
      onUpdate(cell.id, { band_id: newBandId });
    },
    [bandValue, findBandId, cell.id, onUpdate],
  );

  const handleNotesChange = useCallback((value: string) => onNotesChange(cell.id, value), [cell.id, onNotesChange]);

  const firstCellBorderClass = {
    added: "border-l-2 border-l-green-500",
    modified: "border-l-2 border-l-amber-500",
    deleted: "border-l-2 border-l-red-500",
    unchanged: "",
  }[diffStatus];

  const isDeleted = diffStatus === "deleted";
  const deletedCellClass = isDeleted ? "opacity-50" : "";

  const actionButton = onRestore ? (
    <Button type="button" variant="ghost" size="sm" onClick={onRestore} className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-500">
      <HugeiconsIcon icon={DeletePutBackIcon} className="size-3.5" />
    </Button>
  ) : (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onRemove(cell.id)}
      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
    >
      <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
    </Button>
  );

  return (
    <tr className={cn("border-b last:border-0 hover:bg-muted/20", isDeleted && "bg-muted/10")}>
      <td className={cn("px-3 py-1", firstCellBorderClass, deletedCellClass)}>
        <Select
          disabled={diffStatus === "deleted"}
          value={bandValue?.toString() ?? ""}
          onValueChange={(value) => handleBandValueChange(value ? Number.parseInt(value, 10) : null)}
        >
          <SelectTrigger className={`h-7 w-24 text-sm ${error?.band_id ? "border-destructive" : ""}`}>
            <SelectValue>{bandValue ? bandValue : t("common:placeholder.selectBand")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {uniqueBandValues.map((value) => (
              <SelectItem key={value} value={value.toString()}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      {rat !== "GSM" ? (
        <td className={cn("px-3 py-1", deletedCellClass)}>
          {hasDuplexChoice ? (
            <Select
              disabled={diffStatus === "deleted"}
              value={duplex ?? "_none"}
              onValueChange={(value) => handleDuplexChange(value === "_none" ? null : value)}
            >
              <SelectTrigger className="h-7 w-20 text-sm">
                <SelectValue>{duplex ?? "-"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {duplexOptions.includes(null) && <SelectItem value="_none">-</SelectItem>}
                {duplexOptions
                  .filter((d) => d !== null)
                  .map((duplex) => (
                    <SelectItem key={duplex} value={duplex}>
                      {duplex}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          )}
        </td>
      ) : null}
      <CellDetailsFields
        rat={rat}
        bandValue={bandValue}
        details={cell.details as Record<string, unknown>}
        detailErrors={error?.details}
        disabled={diffStatus === "deleted"}
        onDetailChange={(field, value) => onDetailsChange(cell.id, field, value)}
      />
      <td className={cn("px-3 py-1", deletedCellClass)}>
        <DebouncedNotesInput
          value={cell.notes ?? ""}
          placeholder={t("stations:cells.notesPlaceholder")}
          disabled={isDeleted}
          onChange={handleNotesChange}
        />
      </td>
      <td className="px-3 py-1">
        <Tooltip>
          <TooltipTrigger render={actionButton} />
          <TooltipContent>{onRestore ? t("common:actions.restore") : t("common:actions.delete")}</TooltipContent>
        </Tooltip>
      </td>
    </tr>
  );
});
