import { FlashIcon, SignalFull02Icon, SmartPhone01Icon, Wifi01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { memo } from "react";

import { cn } from "@/lib/utils";

export const RAT_CONFIG = {
  GSM: { icon: SignalFull02Icon, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "2G" },
  UMTS: { icon: Wifi01Icon, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", label: "3G" },
  LTE: { icon: SmartPhone01Icon, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400", label: "4G" },
  NR: { icon: FlashIcon, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "5G" },
} as const;

export type Rat = keyof typeof RAT_CONFIG;

interface RatBadgeProps {
  rat: string;
  className?: string;
  showTechName?: boolean;
}

export const RatBadge = memo(({ rat, className, showTechName }: RatBadgeProps) => {
  const config = RAT_CONFIG[rat as Rat];
  if (!config) {
    return <span className="font-mono text-[10px] text-muted-foreground">{rat}</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium", config.color, className)}>
      <HugeiconsIcon icon={config.icon} className="size-3" />
      {showTechName ? rat : config.label}
    </span>
  );
});
