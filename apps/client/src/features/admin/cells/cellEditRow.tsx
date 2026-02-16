import { memo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Band } from "@/types/station";
import { useBandSelection } from "./hooks/useBandSelection";
import { CellDetailsFields } from "./cellDetailsFields";
import { useTranslation } from "react-i18next";
import type { RAT_ORDER } from "./rat";

export type CellDraftBase = {
  _localId: string;
  rat: (typeof RAT_ORDER)[number];
  band_id: number;
  is_confirmed: boolean;
  notes: string;
  details: Record<string, unknown>;
};

type CellEditRowProps = {
  localCell: CellDraftBase;
  bands: Band[];
  disabled?: boolean;
  leftBorderClass?: string;
  showDelete?: boolean;
  rowClassName?: string;
  onChange: (localId: string, patch: Partial<CellDraftBase>) => void;
  onDelete: (localId: string) => void;
};

export const CellEditRow = memo(function CellEditRow({
  localCell,
  bands,
  disabled,
  leftBorderClass,
  showDelete = true,
  rowClassName,
  onChange,
  onDelete,
}: CellEditRowProps) {
  const { t } = useTranslation();
  const { uniqueBandValues, bandValue, duplex, duplexOptions, hasDuplexChoice, findBandId, bandsForRat } = useBandSelection(
    bands,
    localCell.rat,
    localCell.band_id,
  );

  const handleBandValueChange = (value: number | null) => {
    const opts = value ? [...new Set(bandsForRat.filter((b) => b.value === value).map((b) => b.duplex))] : [];
    const defaultDuplex = opts.length === 1 ? opts[0] : null;
    const newBandId = findBandId(value, defaultDuplex);
    if (newBandId) {
      const patch: Partial<CellDraftBase> = { band_id: newBandId };
      if (localCell.rat === "GSM" && value === 1800) {
        patch.details = { ...localCell.details, e_gsm: false };
      }
      onChange(localCell._localId, patch);
    }
  };

  const handleDuplexChange = (dup: string | null) => {
    const newBandId = findBandId(bandValue, dup);
    if (newBandId) onChange(localCell._localId, { band_id: newBandId });
  };

  const handleDetailChange = (field: string, value: number | boolean | undefined) => {
    const next = { ...localCell.details };
    if (value === undefined) delete next[field];
    else next[field] = value;
    onChange(localCell._localId, { details: next });
  };

  return (
    <tr className={cn("border-b last:border-0 hover:bg-muted/20", rowClassName)}>
      <td className={cn("px-3 py-1", leftBorderClass)}>
        <Select
          value={bandValue?.toString() ?? ""}
          onValueChange={(v) => handleBandValueChange(v ? Number.parseInt(v, 10) : null)}
          disabled={disabled}
        >
          <SelectTrigger className="h-7 w-24 text-sm">
            <SelectValue>{bandValue ? `${bandValue} MHz` : "-"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {uniqueBandValues.map((v) => (
              <SelectItem key={v} value={v.toString()}>
                {v} MHz
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      {localCell.rat !== "GSM" && (
        <td className="px-3 py-1">
          {hasDuplexChoice ? (
            <Select value={duplex ?? "_none"} onValueChange={(v) => handleDuplexChange(v === "_none" ? null : v)} disabled={disabled}>
              <SelectTrigger className="h-7 w-20 text-sm">
                <SelectValue>{duplex ?? "-"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {duplexOptions.includes(null) && <SelectItem value="_none">-</SelectItem>}
                {duplexOptions
                  .filter((d) => d !== null)
                  .map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          )}
        </td>
      )}
      <CellDetailsFields
        rat={localCell.rat}
        bandValue={bandValue}
        details={localCell.details}
        disabled={disabled}
        onDetailChange={handleDetailChange}
      />
      <td className="px-3 py-1">
        <Input
          type="text"
          placeholder={t("stations:cells.notesPlaceholder")}
          value={localCell.notes}
          onChange={(e) => onChange(localCell._localId, { notes: e.target.value })}
          className="h-7 w-28 text-sm"
          disabled={disabled}
        />
      </td>
      <td className="px-3 py-1">
        <Checkbox
          checked={localCell.is_confirmed}
          onCheckedChange={(checked) => onChange(localCell._localId, { is_confirmed: checked === true })}
          disabled={disabled}
        />
      </td>
      <td className="px-3 py-1">
        {showDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(localCell._localId)}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
          </Button>
        )}
      </td>
    </tr>
  );
});
