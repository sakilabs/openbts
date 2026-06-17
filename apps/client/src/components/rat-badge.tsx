import { HugeiconsIcon } from "@hugeicons/react";
import { memo } from "react";

import { RAT_ICONS, ratToGenLabel } from "@/features/shared/rat";
import { cn } from "@/lib/utils";

export const RAT_COLORS = {
  GSM: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  UMTS: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  LTE: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  NR: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
} as const;

export type Rat = keyof typeof RAT_COLORS;

interface RatBadgeProps {
  rat: string;
  className?: string;
  showTechName?: boolean;
}

export const RatBadge = memo(({ rat, className, showTechName }: RatBadgeProps) => {
  const color = RAT_COLORS[rat as Rat];
  const icon = RAT_ICONS[rat];
  if (!color || !icon) {
    return <span className="font-mono text-[10px] text-muted-foreground">{rat}</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium", color, className)}>
      <HugeiconsIcon icon={icon} className="size-3" />
      {showTechName ? rat : ratToGenLabel(rat)}
    </span>
  );
});
