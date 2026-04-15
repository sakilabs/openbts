import {
  Globe02Icon,
  Image01Icon,
  InformationCircleIcon,
  Location01Icon,
  MapsLocation01Icon,
  Message01Icon,
  MountainIcon,
  Note01Icon,
  SignalFull02Icon,
  Tag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RAT_ORDER } from "@/features/map/constants";
import { usePreferences } from "@/hooks/usePreferences";
import { useSettings } from "@/hooks/useSettings";
import { fetchApiData } from "@/lib/api";
import { formatCoordinates } from "@/lib/gpsUtils";
import { cn } from "@/lib/utils";
import type { Station, StationComment } from "@/types/station";

import { fetchElevation, fetchPemReports, fetchStationPhotos } from "../api";
import { TAB_OPTIONS, type TabId } from "../tabs";
import { groupCellsByRat } from "../utils";
import { CellTable } from "./cellTable";
import { CommentsList } from "./commentsList";
import { CopyButton } from "./copyButton";
import { ExtraIdentificatorsDisplay } from "./extraIdentificators";
import { NavigationLinks } from "./navLinks";
import { PermitsList } from "./permitsList";
import { PhotoGallery } from "./photoGallery";

type StationDetailsBodyProps = {
  stationId: number;
  source: "internal" | "uke";
  isLoading: boolean;
  error: unknown;
  station?: Station;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onClose: () => void;
  isAdmin?: boolean;
};

export function StationDetailsBody({
  stationId,
  source,
  isLoading,
  error,
  station,
  activeTab,
  onTabChange,
  onClose,
  isAdmin = false,
}: StationDetailsBodyProps) {
  const { t } = useTranslation(["stationDetails", "common"]);
  const { data: settings } = useSettings();
  const { preferences } = usePreferences();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [minContentHeight, setMinContentHeight] = useState(0);

  useEffect(() => {
    if (!minContentHeight || !contentRef.current) return;
    const el = contentRef.current;
    const observer = new ResizeObserver(() => {
      if (el.offsetHeight >= minContentHeight) {
        setMinContentHeight(0);
        observer.disconnect();
      }
    });

    observer.observe(el);
    const id = setTimeout(() => {
      setMinContentHeight(0);
      observer.disconnect();
    }, 1500);
    return () => {
      observer.disconnect();
      clearTimeout(id);
    };
  }, [minContentHeight]);

  const handleTabChange = (tab: TabId) => {
    if (contentRef.current) setMinContentHeight(contentRef.current.offsetHeight);
    onTabChange(tab);
  };
  const isOnMap = location.pathname === "/" || location.pathname.startsWith("/lists/");
  const cellGroups = station ? groupCellsByRat(station.cells) : {};

  const { data: photos } = useQuery({
    queryKey: ["station-photos", stationId],
    queryFn: () => fetchStationPhotos(stationId),
    staleTime: 1000 * 60 * 5,
    enabled: source === "internal" && !!settings?.photosEnabled,
  });

  const { data: comments } = useQuery({
    queryKey: ["station-comments", stationId],
    queryFn: () => fetchApiData<StationComment[]>(`stations/${stationId}/comments`, { allowedErrors: [404, 403] }).then((data) => data ?? []),
    staleTime: 1000 * 60 * 5,
    enabled: source === "internal" && !!settings?.enableStationComments,
  });

  const { data: pemReports } = useQuery({
    queryKey: ["station-pem", station?.station_id, station?.location.latitude, station?.location.longitude, station?.operator?.mnc],
    queryFn: () =>
      fetchPemReports(station!.station_id!.replace(/^[TO]-/, ""), station!.location.latitude, station!.location.longitude, station!.operator.mnc),
    staleTime: 1000 * 60 * 60,
    enabled: source === "internal" && !!station?.station_id,
    retry: false,
  });

  const { data: elevation } = useQuery({
    queryKey: ["elevation", station?.location.latitude, station?.location.longitude],
    queryFn: () => fetchElevation(station!.location.latitude, station!.location.longitude),
    staleTime: 1000 * 60 * 60 * 24,
    enabled: source === "internal" && !!station?.location && preferences.showElevation,
    retry: false,
  });

  const tabCounts: Partial<Record<TabId, number>> = {
    ...(photos !== undefined ? { photos: photos.length } : {}),
    ...(comments !== undefined ? { comments: comments.length } : {}),
  };
  const showSI2PEMLink = !!station?.station_id && !station.station_id.startsWith("O-") && !station.station_id.startsWith("N");
  const visibleTabs = useMemo(
    () =>
      source === "uke"
        ? TAB_OPTIONS.filter((tab) => tab.id === "permits")
        : TAB_OPTIONS.filter((tab) => {
            if (tab.id === "comments" && !settings?.enableStationComments) return false;
            if (tab.id === "photos" && !settings?.photosEnabled) return false;
            return true;
          }),
    [source, settings?.enableStationComments, settings?.photosEnabled],
  );

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {isLoading ? (
        <div className="p-6 space-y-8">
          <div className="flex p-1 bg-muted/50 rounded-xl gap-1">
            {[1, 2, 3].map((i) => (
              <div key={`skeleton-tab-${i}`} className="flex-1 flex items-center justify-center gap-2 py-2 px-3">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 w-16 rounded hidden sm:block" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-32 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-4 border rounded-xl">
              {[1, 2, 3, 4].map((i) => (
                <div key={`skeleton-field-${i}`} className="flex items-center gap-2">
                  <Skeleton className="size-4 rounded shrink-0" />
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-3 w-24 rounded ml-auto" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-24 rounded" />
            {[1, 2].map((i) => (
              <div key={`skeleton-card-${i}`} className="rounded-xl border overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-4 w-12 rounded" />
                  <Skeleton className="h-3 w-16 rounded ml-auto" />
                </div>
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={`skeleton-row-${j}`} className="flex gap-4">
                      <Skeleton className="h-4 w-20 rounded" />
                      <Skeleton className="h-4 w-16 rounded" />
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-4 w-24 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
            <HugeiconsIcon icon={InformationCircleIcon} className="size-6" />
          </div>
          <p className="text-muted-foreground max-w-xs">{error instanceof Error ? error.message : t("common:placeholder.errorFetching")}</p>
        </div>
      ) : station ? (
        <div ref={contentRef} className="p-6 space-y-8" style={minContentHeight ? { minHeight: minContentHeight } : undefined}>
          <div className="flex p-1 bg-muted/50 rounded-xl gap-1">
            {visibleTabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
                )}
              >
                <HugeiconsIcon icon={tab.icon} className="size-4" />
                <span className="hidden sm:inline">{t(`tabs.${tab.id}`)}</span>
                {tabCounts[tab.id] !== undefined && tabCounts[tab.id]! > 0 && (
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-xs font-bold bg-primary text-primary-foreground leading-none animate-in fade-in zoom-in-50 duration-200">
                    {tabCounts[tab.id]! > 99 ? "99+" : tabCounts[tab.id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {source === "internal" ? (
            <>
              {activeTab === "specs" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("specs.basicInfo")}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 p-4 border rounded-xl bg-muted/20">
                      <div className="flex items-center gap-2 flex-wrap">
                        <HugeiconsIcon icon={Location01Icon} className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">{t("common:labels.coordinates")}:</span>
                        <span className="text-sm font-mono font-medium break-all">
                          {formatCoordinates(station.location.latitude, station.location.longitude, preferences.gpsFormat)}
                        </span>
                        <CopyButton text={`${station?.location.latitude}, ${station?.location.longitude}`} />
                        {preferences.navLinksDisplay === "inline" && (
                          <NavigationLinks latitude={station.location.latitude} longitude={station.location.longitude} displayMode="inline" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Globe02Icon} className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground">{t("common:labels.region")}:</span>
                        <span className="text-sm font-medium">{station.location.region?.name || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Tag01Icon} className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground">{t("common:labels.stationId")}:</span>
                        <span className="text-sm font-mono font-medium">{station.station_id}</span>
                        <div className="flex items-center gap-1">
                          <CopyButton text={station.station_id || ""} />
                          {showSI2PEMLink ? (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <a
                                    href={
                                      pemReports?.[0]?.url ??
                                      `https://si2pem.gov.pl/installations/?base_station=${station.station_id.replace(/^[TO]-/, "")}&page_size=25`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center h-5.5 w-auto px-0.5 hover:bg-muted rounded transition-colors cursor-pointer shrink-0"
                                  >
                                    <span
                                      aria-hidden="true"
                                      className="block h-3.5 bg-[#2e2e5a] dark:bg-[#9898ce]"
                                      style={{
                                        aspectRatio: "2435/521",
                                        maskImage: "url(/si2pem.svg)",
                                        WebkitMaskImage: "url(/si2pem.svg)",
                                        maskSize: "contain",
                                        WebkitMaskSize: "contain",
                                        maskRepeat: "no-repeat",
                                        WebkitMaskRepeat: "no-repeat",
                                      }}
                                    />
                                  </a>
                                }
                              />
                              <TooltipContent>{pemReports?.[0] ? t("specs.si2pemReportLink") : t("specs.si2pemLink")}</TooltipContent>
                            </Tooltip>
                          ) : null}
                        </div>
                      </div>
                      {station.extra_identificators && (
                        <ExtraIdentificatorsDisplay data={station.extra_identificators} operatorMnc={station.operator?.mnc} />
                      )}
                      {elevation !== undefined && (
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon icon={MountainIcon} className="size-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">{t("common:labels.elevation")}:</span>
                          <span className="text-sm font-medium">{elevation} m</span>
                        </div>
                      )}
                      {(!isOnMap || (preferences.navLinksDisplay === "buttons" && preferences.navigationApps.length > 0)) && (
                        <div className="sm:col-span-2 pt-3 border-t border-border/50">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {!isOnMap && (
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Link
                                      to="/"
                                      hash={`map=16/${station.location.latitude}/${station.location.longitude}~f~L${station.location.id}`}
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
                  </section>

                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("specs.cellDetails")}</h3>
                    {Object.keys(cellGroups).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                        <HugeiconsIcon icon={SignalFull02Icon} className="size-8 mb-2 opacity-20" />
                        <p className="text-sm">{t("stations:cells.noStationCells")}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {RAT_ORDER.filter((rat) => cellGroups[rat]).map((rat) => (
                          <CellTable key={rat} rat={rat} cells={cellGroups[rat]} />
                        ))}
                      </div>
                    )}
                  </section>

                  {station?.notes && (
                    <section>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <HugeiconsIcon icon={Note01Icon} className="size-4" /> {t("specs.internalNotes")}
                      </h3>
                      <p className="text-sm p-4 border rounded-xl bg-muted/20">{station.notes}</p>
                    </section>
                  )}
                </div>
              )}

              {activeTab === "permits" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                      <HugeiconsIcon icon={Note01Icon} className="size-4" /> {t("tabs.permits")}
                    </h3>
                    <PermitsList stationId={stationId} />
                  </section>
                </div>
              )}

              {activeTab === "comments" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                      <HugeiconsIcon icon={Message01Icon} className="size-4" /> {t("comments.title")}
                    </h3>
                    <CommentsList stationId={stationId} isAdmin={isAdmin} />
                  </section>
                </div>
              )}

              {activeTab === "photos" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                      <HugeiconsIcon icon={Image01Icon} className="size-4" /> {t("photos.title")}
                    </h3>
                    <PhotoGallery stationId={stationId} isAdmin={isAdmin} />
                  </section>
                </div>
              )}
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <HugeiconsIcon icon={Note01Icon} className="size-4" /> {t("tabs.permits")}
                </h3>
                <PermitsList stationId={stationId} isUkeSource />
              </section>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
