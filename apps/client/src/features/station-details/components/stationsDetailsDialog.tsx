import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, PencilEdit02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Link } from "@tanstack/react-router";
import { authClient } from "@/lib/authClient";
import { getOperatorColor } from "@/lib/operatorUtils";
import { getHardwareLeaseOperator } from "@/lib/stationUtils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useSettings } from "@/hooks/useSettings";
import { usePreferences } from "@/hooks/usePreferences";
import { formatRelativeTime, formatFullDate } from "@/lib/format";
import { fetchStation } from "../api";
import { StationDetailsBody } from "./dialogBody";
import { MainPhotoPanel } from "./mainPhotoPanel";
import { ShareButton } from "./shareButton";
import type { TabId } from "../tabs";

type StationDetailsDialogProps = {
  stationId: number | null;
  source: "internal" | "uke";
  onClose: () => void;
};

export function StationDetailsDialog({ stationId, source, onClose }: StationDetailsDialogProps) {
  const { t, i18n } = useTranslation(["stationDetails", "common"]);
  const { t: tCommon } = useTranslation("common");
  const [activeTab, setActiveTab] = useState<TabId>(source === "uke" ? "permits" : "specs");
  const { data: settings } = useSettings();
  const { data: session } = authClient.useSession();
  const userRole = session?.user?.role as string | undefined;
  const isAdmin = userRole === "admin" || userRole === "editor";
  const { preferences } = usePreferences();

  const {
    data: station,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["station", stationId, source],
    queryFn: () => fetchStation(stationId as number),
    enabled: !!stationId && source === "internal",
    staleTime: 1000 * 60 * 5,
  });

  useEscapeKey(onClose, !!stationId);

  if (!stationId) return null;

  const operatorColor = station ? getOperatorColor(station.operator.mnc) : "#3b82f6";

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm cursor-default"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Enter" && onClose()}
        aria-label={t("common:actions.close")}
      />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto sm:items-center pointer-events-none">
        <div className="relative pointer-events-auto animate-in fade-in zoom-in-95 duration-200 w-full max-w-3xl">
          <div className="relative bg-background rounded-2xl shadow-2xl w-full max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden">
            <div className="shrink-0 bg-background/95 backdrop-blur-sm border-b">
              <div className="h-1" style={{ backgroundColor: operatorColor }} />
              <div className="px-6 py-4 flex items-start">
                <div className="flex-1 min-w-0">
                  {isLoading ? (
                    <div className="space-y-2">
                      <div className="h-5 w-48 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    </div>
                  ) : station ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h2 className="text-lg font-bold tracking-tight truncate" style={{ color: operatorColor }}>
                          {station.operator.name}
                        </h2>
                        {getHardwareLeaseOperator(station.station_id) ? (
                          <Tooltip>
                            <TooltipTrigger className="text-sm text-muted-foreground font-mono font-medium cursor-help underline decoration-dashed decoration-amber-500/50 underline-offset-2 shrink-0">
                              {station.station_id}
                            </TooltipTrigger>
                            <TooltipContent>{t("dialog.hardwareLease", { operator: getHardwareLeaseOperator(station.station_id) })}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-muted-foreground font-mono font-medium shrink-0">{station.station_id}</span>
                        )}
                        {station.is_confirmed && (
                          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                            <HugeiconsIcon icon={Tick02Icon} className="size-3.5" />
                            <span className="hidden sm:inline">{t("common:labels.confirmed")}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{station.location.city}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {station.extra_address || station.location.address || t("dialog.btsStation")}
                        </p>
                        <div className="flex flex-col items-start sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 pt-0.5">
                          <Tooltip>
                            <TooltipTrigger className="text-xs text-muted-foreground cursor-default whitespace-nowrap">
                              {tCommon("labels.created")}: {formatRelativeTime(station.createdAt, tCommon)}
                            </TooltipTrigger>
                            <TooltipContent>{formatFullDate(station.createdAt, i18n.language)}</TooltipContent>
                          </Tooltip>
                          <span className="hidden sm:inline text-xs text-muted-foreground/40">·</span>
                          <Tooltip>
                            <TooltipTrigger className="text-xs text-muted-foreground cursor-default whitespace-nowrap">
                              {tCommon("labels.updated")}: {formatRelativeTime(station.updatedAt, tCommon)}
                            </TooltipTrigger>
                            <TooltipContent>{formatFullDate(station.updatedAt, i18n.language)}</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-2">
                  {station && (
                    <>
                      <ShareButton
                        title={`${station.operator.name} - ${station.station_id}`}
                        text={`${station.operator.name} ${station.station_id} - ${station.location.city}`}
                        url={`${window.location.origin}/#map=16/${station.location.latitude}/${station.location.longitude}?station=${station.id}`}
                        size="md"
                      />
                      {isAdmin ? (
                        <Link
                          to="/admin/stations/$id"
                          params={{ id: String(station.id) }}
                          search={{ uke: undefined }}
                          className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold shadow-sm hover:bg-primary/20 transition-colors"
                          onClick={onClose}
                        >
                          <HugeiconsIcon icon={PencilEdit02Icon} className="size-3.5" />
                          <span className="hidden sm:inline">{t("common:actions.edit")}</span>
                        </Link>
                      ) : (
                        settings?.submissionsEnabled && (
                          <Link
                            to="/submission"
                            search={{ station: String(station.id) }}
                            className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold shadow-sm hover:bg-primary/20 transition-colors"
                            onClick={onClose}
                          >
                            <HugeiconsIcon icon={PencilEdit02Icon} className="size-3.5" />
                            <span className="hidden sm:inline">{t("common:actions.edit")}</span>
                          </Link>
                        )
                      )}
                    </>
                  )}
                  <button type="button" onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
                    <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
                  </button>
                </div>
              </div>
            </div>

            <StationDetailsBody
              stationId={stationId}
              source={source}
              isLoading={isLoading}
              error={error}
              station={station}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onClose={onClose}
              isAdmin={isAdmin}
            />
          </div>

          {source === "internal" && !!stationId && preferences.showStationPhotoPanel && (
            <div className="absolute top-0 left-full pl-3 hidden md:flex h-full max-h-[calc(100dvh-2rem)]">
              <MainPhotoPanel stationId={stationId} onOpenPhotoTab={() => setActiveTab("photos")} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
