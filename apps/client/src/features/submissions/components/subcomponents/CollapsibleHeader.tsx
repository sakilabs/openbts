import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { RAT_ICONS } from "@/features/shared/rat";
import type { RatType } from "../../types";

type DiffCounts = {
  added: number;
  modified: number;
  deleted: number;
};

type CollapsibleHeaderProps = {
  rat: RatType;
  cellsCount: number;
  diffCounts: DiffCounts;
  onAddCell: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

function DiffBadge({ count, color, label }: { count: number; color: string; label: string }) {
  if (count <= 0) return null;

  return (
    <span className={`text-xs text-${color}-600 flex items-center gap-1`}>
      <span className={`size-1.5 rounded-full bg-${color}-500`} />
      {count}
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

export function CollapsibleHeader({ rat, cellsCount, diffCounts, onAddCell, t }: CollapsibleHeaderProps) {
  return (
    <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center justify-between">
      <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer select-none group">
        <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 text-muted-foreground group-data-panel-open:rotate-0 -rotate-90" />
        <HugeiconsIcon icon={RAT_ICONS[rat]} className="size-4 text-primary" />
        <span className="font-semibold text-sm">{rat}</span>
        <span className="text-xs text-muted-foreground inline sm:hidden">({cellsCount})</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">({t("stations:cells.cellsCount", { count: cellsCount })})</span>
        <DiffBadge count={diffCounts.added} color="green" label={t("stations:cells.diffAdded", { count: diffCounts.added })} />
        <DiffBadge count={diffCounts.modified} color="amber" label={t("stations:cells.diffModified", { count: diffCounts.modified })} />
        <DiffBadge count={diffCounts.deleted} color="red" label={t("stations:cells.diffDeleted", { count: diffCounts.deleted })} />
      </CollapsibleTrigger>
      <Button type="button" variant="ghost" size="sm" onClick={onAddCell} className="h-7 text-xs">
        <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
        <span className="hidden sm:inline">{t("stations:cells.addCell")}</span>
      </Button>
    </div>
  );
}
