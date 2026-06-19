import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DetailHeaderMetaItem, DetailHeaderTimestamp } from "@/features/admin/components/detailHeaderMeta";
import { useDeleteStationMutation } from "@/features/admin/stations/mutations";
import { StationStatusBadge } from "@/features/stations/components/StationStatusBadge";
import { useScrolled } from "@/hooks/useScrolled";
import { showApiError } from "@/lib/api";
import { getOperatorColor } from "@/lib/operatorUtils";
import { cn } from "@/lib/utils";
import type { Operator, Station } from "@/types/station";

type StationDetailHeaderProps = {
  station?: Station;
  stationId: string;
  isCreateMode: boolean;
  selectedOperator?: Operator;
  isSaving: boolean;
  hasChanges: boolean;
  onSave: () => void;
  onRevert: () => void;
};

export function StationDetailHeader({
  station,
  stationId,
  isCreateMode,
  selectedOperator,
  isSaving,
  hasChanges,
  onSave,
  onRevert,
}: StationDetailHeaderProps) {
  const { t, i18n } = useTranslation(["stations", "common"]);
  const navigate = useNavigate();
  const deleteMutation = useDeleteStationMutation();

  const { ref: headerRef, scrolled } = useScrolled();
  const stationLabel = isCreateMode ? t("common:labels.newStation") : (station?.station_id ?? stationId);
  const operatorLabel = selectedOperator?.name ?? station?.operator.name ?? "-";
  const locationLabel = station?.location ? [station.location.city, station.location.address].filter(Boolean).join(", ") : "-";

  const handleDelete = () => {
    if (!station) return;
    deleteMutation.mutate(station.id, {
      onSuccess: () => {
        toast.success(t("toast.deleted"));
        void navigate({ to: "/admin/stations" });
      },
      onError: (error) => {
        showApiError(error);
      },
    });
  };

  return (
    <div
      ref={headerRef}
      className={cn(
        "shrink-0 border-b px-4 sm:px-6 py-2 sticky top-0 z-20 transition-[background-color,border-color,box-shadow] duration-150",
        scrolled ? "bg-background shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "bg-background border-transparent shadow-none",
      )}
      style={{
        borderTopWidth: "3px",
        borderTopColor: selectedOperator ? getOperatorColor(selectedOperator.mnc) : "transparent",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="text-muted-foreground hover:text-foreground gap-2 pl-1 pr-3 -ml-2 hover:bg-muted/50 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          <span className="font-medium">{t("common:actions.back")}</span>
        </Button>

        <div className="flex items-center gap-2">
          {!isCreateMode && station && (
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" />}
              >
                {t("header.deleteStation")}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("header.confirmDelete")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("header.confirmDeleteDesc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                    {deleteMutation.isPending ? <Spinner /> : t("header.deleteStation")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRevert}
                disabled={!hasChanges}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                {isCreateMode ? t("common:actions.clear") : t("common:actions.revert")}
              </Button>
            </TooltipTrigger>
            {!hasChanges && <TooltipContent>{t("common:actions.noChanges")}</TooltipContent>}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Button size="sm" onClick={onSave} disabled={isSaving || !hasChanges} className="shadow-sm font-medium px-4 min-w-25">
                {isSaving ? <Spinner /> : isCreateMode ? t("header.createStation") : t("common:actions.saveChanges")}
              </Button>
            </TooltipTrigger>
            {!hasChanges && <TooltipContent>{t("common:actions.noChanges")}</TooltipContent>}
          </Tooltip>
        </div>
      </div>

      <div className="mt-2 border-t border-border/50 pt-2">
        <div className="flex items-start gap-3 overflow-hidden">
          {selectedOperator && (
            <div className="mt-1.5 size-2.5 rounded-[2px] shrink-0" style={{ backgroundColor: getOperatorColor(selectedOperator.mnc) }} />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate">{stationLabel}</h1>
              {!isCreateMode && station?.status && <StationStatusBadge status={station.status} statusChangedAt={station.statusChangedAt} />}
            </div>
            <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 sm:flex sm:items-center sm:gap-4 overflow-hidden">
              <DetailHeaderMetaItem label={t("common:labels.operator")} value={operatorLabel} className="min-w-0 sm:max-w-40" />
              <DetailHeaderMetaItem label={t("common:labels.id")} value={station?.id ?? "-"} />
              <DetailHeaderTimestamp label={t("common:labels.created")} value={station?.createdAt} locale={i18n.language} />
              <DetailHeaderTimestamp label={t("common:labels.updated")} value={station?.updatedAt} locale={i18n.language} />
              <DetailHeaderMetaItem label={t("common:labels.location")} value={locationLabel} className="min-w-0 sm:max-w-96 col-span-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
