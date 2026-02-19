import { memo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";

export type RadioLineTooltipContentProps = {
  color: string;
  operatorName: string;
  distanceFormatted: string;
  directions: { freq: string; bandwidth: string | null; forward: boolean }[];
  directionCount: number;
};

export const RadioLineTooltipContent = memo(function RadioLineTooltipContent({
  color,
  operatorName,
  distanceFormatted,
  directions,
  directionCount,
}: RadioLineTooltipContentProps) {
  return (
    <div className="min-w-40">
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        <span className="text-xs font-semibold truncate">{operatorName}</span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground whitespace-nowrap">{distanceFormatted}</span>
        {directionCount > 1 && (
          <span className="px-1.5 py-px rounded-full bg-blue-500/10 text-[8px] font-bold uppercase text-blue-500 border border-blue-500/20">FDD</span>
        )}
      </div>

      {directions.length > 0 && (
        <div className="border-t border-border/40 px-2.5 py-1.5 space-y-1">
          {directions.map((dir) => (
            <div key={`${dir.freq}-${dir.bandwidth}-${dir.forward}`} className="flex items-center gap-2">
              {directionCount > 1 && (
                <span className="flex items-center gap-px text-[9px] font-bold text-muted-foreground shrink-0">
                  {dir.forward ? "A" : "B"}
                  <HugeiconsIcon icon={ArrowRight02Icon} className="size-2.5" />
                  {dir.forward ? "B" : "A"}
                </span>
              )}
              <span className="text-[11px] font-mono font-medium whitespace-nowrap">{dir.freq}</span>
              {dir.bandwidth && (
                <>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">{dir.bandwidth}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
