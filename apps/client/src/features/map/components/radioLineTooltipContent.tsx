import { Separator } from "@/components/ui/separator";
import { memo } from "react";

export type RadioLineTooltipContentProps = {
  color: string;
  freqFormatted: string;
  operatorName: string;
  distanceFormatted: string;
  totalSpeedFormatted?: string;
};

export const RadioLineTooltipContent = memo(function RadioLineTooltipContent({
  color,
  freqFormatted,
  operatorName,
  distanceFormatted,
  totalSpeedFormatted,
}: RadioLineTooltipContentProps) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 flex-wrap">
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <span className="text-xs font-medium whitespace-nowrap">{freqFormatted}</span>
      <Separator orientation="vertical" />
      <span className="text-xs font-medium truncate min-w-0 max-w-[6rem]">{operatorName}</span>
      <Separator orientation="vertical" />
      <span className="text-xs font-medium whitespace-nowrap">{distanceFormatted}</span>
      {totalSpeedFormatted && (
        <>
          <Separator orientation="vertical" />
          <span className="text-xs font-medium whitespace-nowrap">{totalSpeedFormatted}</span>
        </>
      )}
    </div>
  );
});
