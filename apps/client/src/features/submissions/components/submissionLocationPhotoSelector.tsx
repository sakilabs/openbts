import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon, Image01Icon, Tick02Icon, Upload04Icon } from "@hugeicons/core-free-icons";
import { Spinner } from "@/components/ui/spinner";
import { fetchLocationPhotos, fetchStationPhotos } from "@/features/station-details/api";
import type { LocationPhoto } from "@/features/station-details/api";

type Props = {
  stationId: number;
  locationId: number;
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
};

export function SubmissionLocationPhotoSelector({ stationId, locationId, selectedIds, onSelectionChange }: Props) {
  const { t, i18n } = useTranslation("submissions");

  const { data: locationPhotos = [], isLoading: loadingLocation } = useQuery({
    queryKey: ["location-photos", locationId],
    queryFn: () => fetchLocationPhotos(locationId),
    staleTime: 1000 * 60 * 5,
  });

  const { data: stationPhotos = [], isLoading: loadingStation } = useQuery({
    queryKey: ["station-photos", stationId],
    queryFn: () => fetchStationPhotos(stationId),
    staleTime: 1000 * 60 * 5,
  });

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!loadingStation && stationPhotos.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      onSelectionChange(stationPhotos.map((p) => p.id));
    }
  }, [loadingStation, stationPhotos, onSelectionChange]);

  const assignedIds = new Set(stationPhotos.map((p) => p.id));
  const selectedSet = new Set(selectedIds);

  function toggleSelect(photo: LocationPhoto) {
    const next = new Set(selectedSet);
    if (next.has(photo.id)) next.delete(photo.id);
    else next.add(photo.id);
    onSelectionChange(Array.from(next));
  }

  const isLoading = loadingLocation || loadingStation;

  if (isLoading) {
    return (
      <div className="border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
          <HugeiconsIcon icon={Image01Icon} className="size-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{t("photos.label")}</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      </div>
    );
  }

  if (locationPhotos.length === 0) {
    return (
      <div className="border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
          <HugeiconsIcon icon={Image01Icon} className="size-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{t("photos.label")}</span>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground gap-1.5">
          <HugeiconsIcon icon={Image01Icon} className="size-8 opacity-20" />
          <p>{t("photos.emptyLocation")}</p>
          <p className="text-xs">{t("photos.uploadBelow")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
        <HugeiconsIcon icon={Image01Icon} className="size-4 text-muted-foreground" />
        <span className="font-semibold text-sm">{t("photos.label")}</span>
        <span className="text-xs text-muted-foreground">
          {t("photos.selectionCount", { selected: selectedSet.size, total: locationPhotos.length })}
        </span>
      </div>
      <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-80 overflow-y-auto">
        {locationPhotos.map((photo) => {
          const isSelected = selectedSet.has(photo.id);
          const isAssigned = assignedIds.has(photo.id);

          return (
            <div
              key={photo.id}
              role="button"
              tabIndex={0}
              className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                isSelected ? "border-primary" : "border-transparent"
              } bg-muted`}
              onClick={() => toggleSelect(photo)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleSelect(photo);
              }}
            >
              <div className="relative aspect-square">
                <img
                  src={`/uploads/${photo.attachment_uuid}.webp`}
                  alt={photo.note ?? ""}
                  className={`w-full h-full object-cover transition-opacity ${isSelected ? "" : "opacity-40"}`}
                  loading="lazy"
                />
                {isAssigned && (
                  <span className="absolute top-1 left-1 bg-primary/80 text-primary-foreground rounded-sm px-1 text-[9px] font-semibold leading-4">
                    {t("photos.alreadyAssigned")}
                  </span>
                )}
                {isSelected && (
                  <div className="absolute top-1 right-1 size-4 rounded-full bg-primary flex items-center justify-center">
                    <HugeiconsIcon icon={Tick02Icon} className="size-2.5 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="px-2 pt-1 pb-1 text-[10px] space-y-0.5">
                <p className="truncate font-medium text-foreground/70">@{photo.author?.username ?? "-"}</p>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <HugeiconsIcon icon={Upload04Icon} className="size-2.5 shrink-0" />
                  <span className="tabular-nums truncate">
                    {new Date(photo.createdAt).toLocaleDateString(i18n.language, { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </div>
                {photo.taken_at ? (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <HugeiconsIcon icon={Camera01Icon} className="size-2.5 shrink-0" />
                    <span className="tabular-nums truncate">
                      {new Date(photo.taken_at).toLocaleDateString(i18n.language, { year: "numeric", month: "short" })}
                    </span>
                  </div>
                ) : null}
                {photo.note ? <p className="truncate italic text-muted-foreground">{photo.note}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
