import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils.js";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip.js";
import { Spinner } from "@/components/ui/spinner.js";
import i18n from "@/i18n/config.js";

type MobileStatsPanelProps = {
  locationCount: number;
  totalCount: number;
  radioLineCount: number;
  radioLineTotalCount: number;
  isRadioLinesFetching: boolean;
  isLoading: boolean;
  isFetching: boolean;
  showStations: boolean;
  searchMode: "bounds" | "search";
  zoom?: number;
  source: "internal" | "uke";
};

export function MobileStatsPanel({
  locationCount,
  totalCount,
  radioLineCount,
  radioLineTotalCount,
  isRadioLinesFetching,
  isLoading,
  isFetching,
  showStations,
  searchMode,
  zoom,
  source,
}: MobileStatsPanelProps) {
  const { t } = useTranslation("main");
  const hasMoreLocations = totalCount > locationCount;
  const hasMoreRadioLines = radioLineTotalCount > radioLineCount;
  const showRadioLines = radioLineCount > 0 || isRadioLinesFetching;

  return (
    <div className="bg-background/95 backdrop-blur-md border rounded-lg shadow-lg overflow-hidden">
      <Tooltip>
        <TooltipTrigger
          className={cn("px-2 py-1.5 bg-muted/30 flex items-center gap-2", hasMoreLocations && "cursor-help")}
          disabled={!hasMoreLocations}
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              {showStations && (
                <>
                  {isLoading || isFetching ? (
                    <Spinner className="size-3 text-primary" />
                  ) : hasMoreLocations ? (
                    <div className="size-1.5 rounded-full shrink-0 bg-amber-500 animate-pulse" />
                  ) : (
                    <div className={cn("size-1.5 rounded-full shrink-0", searchMode === "search" ? "bg-primary" : "bg-emerald-500")} />
                  )}
                  <span className={cn("text-xs font-bold leading-none", hasMoreLocations && "text-amber-500")}>
                    {locationCount.toLocaleString(i18n.language)}
                  </span>
                  <span className="text-[8px] font-bold text-muted-foreground leading-none uppercase tracking-wider">{t("overlay.locations")}</span>
                </>
              )}
              {showRadioLines && (
                <>
                  {showStations && <span className="text-[8px] text-muted-foreground leading-none">·</span>}
                  {isRadioLinesFetching ? (
                    <Spinner className="size-2.5 text-primary" />
                  ) : hasMoreRadioLines ? (
                    <div className="size-1.5 rounded-full shrink-0 bg-amber-500 animate-pulse" />
                  ) : null}
                  <span className={cn("text-xs font-bold leading-none", hasMoreRadioLines && "text-amber-500")}>
                    {radioLineCount.toLocaleString(i18n.language)}
                  </span>
                  <span className="text-[8px] font-bold text-muted-foreground leading-none uppercase tracking-wider">
                    {t("overlay.radiolinesCount", { count: radioLineCount })}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[7px] uppercase font-bold text-primary border-b border-primary/20 leading-none">
                {source === "uke" ? "UKE" : "INT"}
              </span>
              <span className="text-[7px] uppercase font-bold text-blue-600 dark:text-blue-400 border-b border-blue-500/20 leading-none">
                Z{zoom?.toFixed(1) || "-"}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          {showStations && <p>{t("overlay.moreStations", { total: totalCount, shown: locationCount })}</p>}
          {hasMoreRadioLines && (
            <p>
              {t("overlay.moreRadiolines", {
                total: radioLineTotalCount,
                shown: radioLineCount,
              })}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
