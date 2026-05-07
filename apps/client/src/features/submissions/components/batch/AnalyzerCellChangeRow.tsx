import { AlertCircleIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslation } from "react-i18next";

import { RatBadge } from "@/components/rat-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { DraftCell } from "../../utils/fromAnalyzer";

interface Props {
  change: DraftCell;
  onRemove: () => void;
}

export function AnalyzerCellChangeRow({ change, onRemove }: Props) {
  const { t } = useTranslation(["submissions"]);
  const isAddOperation = change.operation === "add";
  const entries = Object.entries(change.details).filter(([, value]) => value !== null && value !== undefined);

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
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-1">
        {entries.map(([field, value]) => (
          <span key={field} className="flex items-center gap-1">
            <span className="font-mono text-[11px] text-muted-foreground">{field.toUpperCase()}</span>
            <span className="font-mono text-[10px] text-muted-foreground/50">{">"}</span>
            <span className="font-mono text-[11px] font-semibold tabular-nums text-foreground">{String(value)}</span>
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
