import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { MapsIcon, Search01Icon, AirportTowerIcon } from "@hugeicons/core-free-icons";
import type { Station } from "@/types/station";
import { getOperatorColor } from "@/lib/operatorUtils";
import type { OSMResult } from "../../types";
import { Spinner } from "@/components/ui/spinner";

type SearchResultsProps = {
  show: boolean;
  isLoading: boolean;
  osmResults: OSMResult[];
  stationResults: Station[];
  onLocationSelect?: (lat: number, lon: number) => void;
  onStationSelect?: (station: Station) => void;
  onClose: () => void;
};

export function SearchResults({ show, isLoading, osmResults, stationResults, onLocationSelect, onStationSelect, onClose }: SearchResultsProps) {
  const { t } = useTranslation("main");

  if (!show) return null;

  const hasResults = osmResults.length > 0 || stationResults.length > 0;

  return (
    <div className="border-t bg-background animate-in fade-in slide-in-from-top-1 duration-150 max-h-[70vh] overflow-y-auto custom-scrollbar rounded-b-2xl shadow-2xl">
      <div className="flex flex-col">
        {isLoading && (
          <div className="p-8 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Spinner className="size-6 text-primary" />
            <p className="text-xs font-medium">{t("search.searching")}</p>
          </div>
        )}

        {!isLoading && !hasResults && (
          <div className="p-8 flex flex-col items-center justify-center text-muted-foreground gap-3 text-center">
            <HugeiconsIcon icon={Search01Icon} className="size-6 opacity-20" />
            <div>
              <p className="text-sm font-medium">{t("search.noResults")}</p>
              <p className="text-xs opacity-60">{t("search.noResultsHint")}</p>
            </div>
          </div>
        )}

        {osmResults.length > 0 && !isLoading && (
          <div className="border-b last:border-0">
            <div className="px-4 py-2 bg-muted/30 flex items-center gap-2 sticky top-0 z-10 backdrop-blur-sm">
              <HugeiconsIcon icon={MapsIcon} className="size-3.5 text-primary" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("searchResults.locations")}</span>
              <span className="ml-auto text-[9px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border/50">
                {t("search.found", { count: osmResults.length })}
              </span>
            </div>
            <div className="p-1 space-y-0.5">
              {osmResults.map((result) => (
                <button
                  type="button"
                  key={result.place_id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onLocationSelect?.(Number.parseFloat(result.lat), Number.parseFloat(result.lon));
                    onClose();
                  }}
                  className="w-full flex flex-col gap-0.5 px-3 py-2.5 rounded-xl hover:bg-accent transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">
                      {result.display_name.split(",")[0]}
                    </span>
                    {(result.addresstype === "city" || result.type === "city") && (
                      <span className="text-[8px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {t("common:labels.city")}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground line-clamp-1">{result.display_name.split(",").slice(1).join(",").trim()}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {stationResults.length > 0 && !isLoading && (
          <div>
            <div className="px-4 py-2 bg-muted/30 flex items-center gap-2 sticky top-0 z-10 backdrop-blur-sm">
              <HugeiconsIcon icon={AirportTowerIcon} className="size-3.5 text-primary" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("searchResults.stations")}</span>
              <span className="ml-auto text-[9px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border/50">
                {t("search.found", { count: stationResults.length })}
              </span>
            </div>
            <div className="p-1 space-y-0.5">
              {stationResults.slice(0, 15).map((station) => (
                <button
                  type="button"
                  key={station.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onStationSelect?.(station);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-all text-left group cursor-pointer"
                >
                  <div
                    className="size-2.5 rounded-full shrink-0 shadow-sm border border-white dark:border-gray-800 transition-transform group-hover:scale-125"
                    style={{
                      backgroundColor: getOperatorColor(station.operator?.mnc),
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                        {station.location?.address || station.location?.city || t("stationDetails:dialog.btsStation")}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {station.networks?.networks_id && (
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            N!{station.networks.networks_id}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{station.station_id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-medium text-foreground/70 italic">{station.operator?.name}</span>
                      <span className="text-[11px] text-muted-foreground/50">•</span>
                      <span className="text-[11px] text-muted-foreground">{station.location?.city}</span>
                    </div>
                  </div>
                </button>
              ))}
              {stationResults.length > 15 && (
                <div className="px-4 py-3 text-[11px] text-center text-muted-foreground italic bg-muted/10 border-t border-dashed">
                  {t("search.showingTop", { shown: 15, total: stationResults.length })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
