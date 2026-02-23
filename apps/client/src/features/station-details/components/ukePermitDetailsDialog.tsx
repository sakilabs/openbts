import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Globe02Icon,
  Link01Icon,
  Wifi01Icon,
  Location01Icon,
  Building02Icon,
  Tag01Icon,
  MapsLocation01Icon,
} from "@hugeicons/core-free-icons";
import { Link, useLocation } from "@tanstack/react-router";
import { getOperatorColor } from "@/lib/operatorUtils";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { CopyButton } from "./copyButton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ShareButton } from "./shareButton";
import { NavigationLinks } from "./navLinks";
import { PermitsList } from "./permitsList";
import type { UkeStation } from "@/types/station";
import { usePreferences } from "@/hooks/usePreferences";
import { formatCoordinates } from "@/lib/gpsUtils";
import { useQuery } from "@tanstack/react-query";
import { fetchUkePermitsByStationId } from "@/features/map/api";

type UkeStationDetailsDialogProps = {
  station: UkeStation | null;
  onClose: () => void;
};

export function UkePermitDetailsDialog({ station, onClose }: UkeStationDetailsDialogProps) {
  const { t } = useTranslation(["stationDetails", "common"]);
  const { preferences } = usePreferences();
  const location = useLocation();
  const isOnMap = location.pathname === "/";

  useEscapeKey(onClose, !!station);

  const { data: permits } = useQuery({
    queryKey: ["uke-permits-by-station", station?.station_id],
    queryFn: () => (station ? fetchUkePermitsByStationId(station.station_id) : Promise.resolve([])),
    enabled: !!station,
    staleTime: 1000 * 60 * 5,
  });

  if (!station) return null;

  const operatorColor = station.operator?.mnc ? getOperatorColor(station.operator.mnc) : "#3b82f6";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Enter" && onClose()}
        aria-label={t("common:actions.close")}
      />

      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="shrink-0 bg-background/95 backdrop-blur-sm border-b">
          <div className="px-6 py-4 flex items-start gap-4">
            <div
              className="size-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
              style={{ backgroundColor: operatorColor }}
            >
              <HugeiconsIcon icon={Wifi01Icon} className="size-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-lg font-bold tracking-tight truncate" style={{ color: operatorColor }}>
                    {station.operator?.name ?? t("main:unknownOperator")}
                  </h2>
                  <span className="text-sm text-muted-foreground font-mono font-medium shrink-0">{station.station_id}</span>
                </div>
                {station.location && (
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-foreground/90 truncate">{station.location.address || t("dialog.btsStation")}</p>
                    <p className="text-xs text-muted-foreground font-medium opacity-80">
                      {station.location.city}
                      {station.location.region && ` - ${station.location.region.name}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-2">
              {station.location && (
                <ShareButton
                  title={`${station.operator?.name ?? "UKE"} - ${station.station_id}`}
                  text={`${station.operator?.name ?? "UKE"} ${station.station_id} - ${station.location.city}`}
                  url={`${window.location.origin}/#map=16/${station.location.latitude}/${station.location.longitude}?source=uke&station=${station.station_id}`}
                  size="md"
                />
              )}
              <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
                <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-6 py-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">{t("specs.basicInfo")}</h3>

            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {station.location && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <HugeiconsIcon icon={Location01Icon} className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">{t("common:labels.coordinates")}:</span>
                    <span className="font-mono text-sm font-medium break-all">
                      {formatCoordinates(station.location.latitude, station.location.longitude, preferences.gpsFormat)}
                    </span>
                    <CopyButton text={`${station.location.latitude}, ${station.location.longitude}`} />
                    {preferences.navLinksDisplay === "inline" && (
                      <NavigationLinks latitude={station.location.latitude} longitude={station.location.longitude} displayMode="inline" />
                    )}
                  </div>
                )}

                {station.location?.region && (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Globe02Icon} className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground">{t("common:labels.region")}:</span>
                    <span className="text-sm font-medium">{station.location.region.name}</span>
                  </div>
                )}

                {station.operator && (
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Building02Icon} className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground">{t("common:labels.operator")}:</span>
                    <span className="text-sm font-medium">{station.operator.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Tag01Icon} className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">{t("common:labels.stationId")}:</span>
                  <span className="font-mono text-sm font-medium">{station.station_id}</span>
                  <div className="flex items-center gap-1">
                    <CopyButton text={station.station_id} />
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <a
                            href={`https://si2pem.gov.pl/installations/?base_station=${station.station_id}&entity=&venue_city=&street=&voivodeship=&county=&page=1&page_size=25`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center p-1 hover:bg-muted rounded transition-colors"
                          />
                        }
                      >
                        <HugeiconsIcon icon={Link01Icon} className="size-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>{t("specs.si2pemLink")}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {station.location && (!isOnMap || (preferences.navLinksDisplay === "buttons" && preferences.navigationApps.length > 0)) && (
                  <div className="sm:col-span-2 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {!isOnMap && (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Link
                                to="/"
                                hash={`map=16/${station.location.latitude}/${station.location.longitude}?source=uke&location=${station.location.id}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                onClick={onClose}
                              />
                            }
                          >
                            <HugeiconsIcon icon={MapsLocation01Icon} className="size-3.5" />
                            {t("dialog.showOnMap")}
                          </TooltipTrigger>
                          <TooltipContent>{t("dialog.showOnMap")}</TooltipContent>
                        </Tooltip>
                      )}
                      {preferences.navLinksDisplay === "buttons" && preferences.navigationApps.length > 0 && (
                        <>
                          {!isOnMap && <Separator orientation="vertical" className="h-5 mx-1" />}
                          <NavigationLinks latitude={station.location.latitude} longitude={station.location.longitude} displayMode="buttons" />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 pb-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">{t("tabs.permits")}</h3>
            <PermitsList permits={permits} />
          </div>
        </div>

        <div className="shrink-0 px-6 py-3 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground text-center">{t("permits.sourceUke")}</p>
        </div>
      </div>
    </div>
  );
}
