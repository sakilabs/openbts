import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils.js";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip.js";
import { Spinner } from "@/components/ui/spinner.js";
import i18n from "@/i18n/config.js";

type StationCounterProps = {
  locationCount: number;
  totalCount: number;
  radioLineCount: number;
  radioLineTotalCount: number;
  isRadioLinesFetching: boolean;
  isLoading: boolean;
  isFetching: boolean;
  showStations: boolean;
  zoom?: number;
  source: "internal" | "uke";
};

export function StationCounter({
  locationCount,
  totalCount,
  radioLineCount,
  radioLineTotalCount,
  isRadioLinesFetching,
  isLoading,
  isFetching,
  showStations,
  zoom,
  source,
}: StationCounterProps) {
  const { t } = useTranslation("main");
  const hasMoreLocations = totalCount > locationCount;
  const hasMoreRadioLines = radioLineTotalCount > radioLineCount;
  const showRadioLines = radioLineCount > 0 || isRadioLinesFetching;

  return (
    <div className="flex items-stretch shadow-xl rounded-lg overflow-hidden border bg-background/95 backdrop-blur-md">
      {showStations && (
        <Tooltip>
          <TooltipTrigger
            className={cn("px-2 py-1.5 flex items-center gap-2 border-r border-border/50", hasMoreLocations && "cursor-help")}
            disabled={!hasMoreLocations}
          >
            {isLoading || isFetching ? (
              <Spinner className="size-3 text-muted-foreground" />
            ) : hasMoreLocations ? (
              <div className="size-1.5 rounded-full shrink-0 bg-amber-500 animate-pulse" />
            ) : (
              <div className="size-1.5 rounded-full shrink-0 bg-emerald-500" />
            )}
            <div className="flex items-baseline gap-1">
              <span className={cn("text-sm font-bold tabular-nums leading-none tracking-tight", hasMoreLocations && "text-amber-500")}>
                {locationCount.toLocaleString(i18n.language)}
              </span>
              <span className="text-[9px] font-bold text-muted-foreground leading-none uppercase tracking-wider">{t("overlay.locations")}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t("overlay.moreStations", { total: totalCount, shown: locationCount })}</TooltipContent>
        </Tooltip>
      )}
      {showRadioLines && (
        <Tooltip>
          <TooltipTrigger
            className={cn("px-2 py-1.5 flex items-center gap-2 border-r border-border/50", hasMoreRadioLines && "cursor-help")}
            disabled={!hasMoreRadioLines}
          >
            {isRadioLinesFetching ? (
              <Spinner className="size-3 text-muted-foreground" />
            ) : hasMoreRadioLines ? (
              <div className="size-1.5 rounded-full shrink-0 bg-amber-500 animate-pulse" />
            ) : (
              <div className="size-1.5 rounded-full shrink-0 bg-emerald-500" />
            )}
            <div className="flex items-baseline gap-1">
              <span className={cn("text-sm font-bold tabular-nums leading-none tracking-tight", hasMoreRadioLines && "text-amber-500")}>
                {radioLineCount.toLocaleString(i18n.language)}
              </span>
              <span className="text-[9px] font-bold text-muted-foreground leading-none uppercase tracking-wider">
                {t("overlay.radiolinesCount", { count: radioLineCount })}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t("overlay.moreRadiolines", {
              total: radioLineTotalCount,
              shown: radioLineCount,
            })}
          </TooltipContent>
        </Tooltip>
      )}
      <div className="bg-muted/30 px-2 py-1.5 flex items-center gap-1.5">
        <span className="text-[8px] uppercase font-bold text-muted-foreground leading-none whitespace-nowrap">
          {source === "uke" ? t("stationDetails:tabs.permits") : t("filters.internalDb")}
        </span>
        <div className="w-px h-2 bg-border/60" />
        <span className="text-[8px] uppercase font-bold text-blue-600/80 dark:text-blue-400/80 leading-none whitespace-nowrap">
          {t("overlay.zoom")} {zoom?.toFixed(1) || "-"}
        </span>
      </div>
    </div>
  );
}
