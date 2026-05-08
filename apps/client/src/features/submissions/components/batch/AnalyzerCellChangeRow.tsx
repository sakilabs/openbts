import { AlertCircleIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslation } from "react-i18next";

import { RatBadge } from "@/components/rat-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBandFromEARFCN, getBandFromUARFCN, getBandMhz } from "@/lib/band-utils";
import { cn } from "@/lib/utils";

import type { DraftCell, MismatchDetails } from "../../utils/fromAnalyzer";

const FIELD_LABELS: Record<string, string> = {
  enbid: "eNBID",
  e_gsm: "E-GSM",
};

interface Props {
  change: DraftCell;
  selectedDuplex: string | null | undefined;
  onDuplexChange: (duplex: string | null) => void;
  onRemove: () => void;
}

export function AnalyzerCellChangeRow({ change, selectedDuplex, onDuplexChange, onRemove }: Props) {
  const { t } = useTranslation(["submissions"]);
  const isAddOperation = change.operation === "add";

  const earfcn = change.rat === "LTE" ? (change.details.earfcn ?? change.baseDetails?.earfcn) : undefined;
  const uarfcn = change.rat === "UMTS" ? (change.details.arfcn ?? change.baseDetails?.arfcn) : undefined;
  const ambiguousDuplex = isAddOperation && change.duplexChoices.length > 0;
  const band = earfcn !== undefined ? getBandFromEARFCN(earfcn) : uarfcn !== undefined ? getBandFromUARFCN(uarfcn) : null;
  const mhz = band !== null ? getBandMhz(band) : null;
  const showBandNumber = !ambiguousDuplex || !!selectedDuplex;

  const fields: { key: string; currentVal: number | boolean | undefined; newVal: number | boolean | undefined; isChanged: boolean }[] = [];

  if (isAddOperation) {
    for (const [key, val] of Object.entries(change.details)) {
      if (val !== null && val !== undefined) fields.push({ key: key, currentVal: undefined, newVal: val, isChanged: true });
    }
  } else {
    const base = change.baseDetails ?? {};
    const changed = change.details;
    const allKeys = [...new Set([...Object.keys(base), ...Object.keys(changed)])];
    for (const key of allKeys) {
      const currentVal = base[key as keyof MismatchDetails];
      const newVal = changed[key as keyof MismatchDetails];
      const isChanged = key in changed && newVal !== null && newVal !== undefined;
      if ((currentVal !== null && currentVal !== undefined) || isChanged)
        fields.push({ key, currentVal, newVal: isChanged ? newVal : undefined, isChanged });
    }
  }

  return (
    <div
      className={cn(
        "group relative flex min-h-5 items-center gap-2 py-1 pl-3.5 pr-1",
        "before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:content-['']",
        change.conflict ? "before:bg-destructive bg-destructive/10" : isAddOperation ? "before:bg-emerald-500" : "before:bg-amber-500",
      )}
    >
      <span
        className={cn(
          "shrink-0 text-[10px] font-bold uppercase tracking-wide",
          change.conflict ? "text-destructive" : isAddOperation ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
        )}
      >
        {isAddOperation ? "ADD" : "UPD"}
      </span>
      <RatBadge rat={change.rat} showTechName />
      {(mhz !== null || band !== null) && (
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {mhz && <span className="font-semibold text-foreground">{mhz}</span>}
          {showBandNumber && band !== null && (
            <span className="opacity-75">
              {mhz ? " " : ""}(b{band})
            </span>
          )}
        </span>
      )}
      {change.operation === "add" && change.duplexChoices.length > 0 ? (
        <Select value={selectedDuplex ?? ""} onValueChange={(v) => onDuplexChange(v || null)}>
          <SelectTrigger className={cn("h-6 w-20 shrink-0 text-xs", !selectedDuplex && "border-amber-500/60 text-amber-600 dark:text-amber-400")}>
            <SelectValue>{selectedDuplex ?? "-"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {change.duplexChoices.map(({ duplex }) => (
              <SelectItem key={duplex ?? "_none"} value={duplex ?? ""}>
                {duplex ?? "-"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-1">
        {fields.map(({ key, currentVal, newVal, isChanged }) => (
          <span key={key} className="flex items-center gap-1">
            <span className="font-mono text-[11px] text-muted-foreground">{FIELD_LABELS[key] ?? key.toUpperCase()}</span>
            {isChanged && currentVal !== null && currentVal !== undefined ? (
              <>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground line-through">{String(currentVal)}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{">"}</span>
                <span className={cn("font-mono text-[11px] font-semibold tabular-nums", "text-amber-600 dark:text-amber-400")}>{String(newVal)}</span>
              </>
            ) : isChanged ? (
              <>
                <span className="font-mono text-[10px] text-muted-foreground">{">"}</span>
                <span
                  className={cn(
                    "font-mono text-[11px] font-semibold tabular-nums",
                    isAddOperation ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {String(newVal)}
                </span>
              </>
            ) : (
              <>
                <span className="font-mono text-[10px] text-muted-foreground">{">"}</span>
                <span className="font-mono text-[11px] tabular-nums text-foreground">{String(currentVal)}</span>
              </>
            )}
          </span>
        ))}
      </div>

      {change.conflict ? (
        <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-destructive">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-3 w-3" />
          {t("batch.conflictBadge")}
        </span>
      ) : null}

      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive" onClick={onRemove}>
        <HugeiconsIcon icon={Delete02Icon} className="h-3 w-3" />
      </Button>
    </div>
  );
}
