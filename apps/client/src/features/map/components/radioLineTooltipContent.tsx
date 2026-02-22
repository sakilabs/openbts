import { memo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import { getLinkTypeStyle, type RadioLinkType } from "../utils";

export type RadioLineTooltipContentProps = {
  color: string;
  operatorName: string;
  distanceFormatted: string;
  directions: { freq: string; bandwidth: string | null; polarization: string | null; forward: boolean }[];
  directionCount: number;
  linkType?: RadioLinkType;
  totalSpeed?: string | null;
};

export const RadioLineTooltipContent = memo(function RadioLineTooltipContent({
  color,
  operatorName,
  distanceFormatted,
  directions,
  directionCount,
  linkType,
  totalSpeed,
}: RadioLineTooltipContentProps) {
  const linkTypeStyle = linkType ? getLinkTypeStyle(linkType) : null;

  return (
    <div className="min-w-40">
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        <span className="text-xs font-semibold truncate">{operatorName}</span>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground whitespace-nowrap">{distanceFormatted}</span>
        {linkTypeStyle && linkType && (
          <span
            className={cn(
              "px-1.5 py-px rounded-full text-[8px] font-bold uppercase border",
              linkTypeStyle.bg,
              linkTypeStyle.text,
              linkTypeStyle.border,
            )}
          >
            {linkType}
          </span>
        )}
        {totalSpeed && <span className="text-[10px] font-mono font-semibold text-emerald-600 whitespace-nowrap">{totalSpeed}</span>}
      </div>

      {directions.length > 0 && (
        <div className="border-t border-border/40 px-2.5 py-1.5 space-y-1">
          {directions.map((dir, index) => {
            const isLastInPair = linkType !== "XPIC" && directionCount > 1 && index % 2 === 1;
            const isLastDirection = index === directions.length - 1;

            return (
              <div key={`${dir.freq}-${dir.polarization}-${dir.forward}`}>
                <div className="flex items-center gap-2">
                  {directionCount > 1 && (
                    <span className="flex items-center gap-px text-[9px] font-bold text-muted-foreground shrink-0">
                      {dir.forward ? "A" : "B"}
                      <HugeiconsIcon icon={ArrowRight02Icon} className="size-2.5" />
                      {dir.forward ? "B" : "A"}
                    </span>
                  )}
                  <span className="text-[11px] font-mono font-medium whitespace-nowrap">{dir.freq}</span>
                  {dir.polarization && <span className="text-[9px] font-bold text-muted-foreground">{dir.polarization}</span>}
                  {dir.bandwidth && (
                    <>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">{dir.bandwidth}</span>
                    </>
                  )}
                </div>
                {isLastInPair && !isLastDirection && <div className="border-b border-border/30 my-1" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
