import { Camera01Icon, Image01Icon, Tick02Icon, Upload04Icon, ZoomInAreaIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { Lightbox } from "@/components/lightbox";
import { Spinner } from "@/components/ui/spinner";
import type { LocationPhoto } from "@/features/station-details/api";
import { fetchLocationPhotos, fetchStationPhotos } from "@/features/station-details/api";
import { cn } from "@/lib/utils";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
function isNew(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < SEVEN_DAYS_MS;
}

type Props = {
  stationId: number;
  locationId: number;
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
};

export function SubmissionLocationPhotoSelector({ stationId, locationId, selectedIds, onSelectionChange }: Props) {
  const { t, i18n } = useTranslation("submissions");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  const assignedIds = new Set(stationPhotos.map((p) => p.id));
  const selectedSet = new Set(selectedIds);

  function toggleSelect(photo: LocationPhoto) {
    const next = new Set(selectedSet);
    if (next.has(photo.id)) next.delete(photo.id);
    else next.add(photo.id);
    onSelectionChange(Array.from(next));
  }

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(
    () => setLightboxIndex((i) => (i !== null ? (i - 1 + locationPhotos.length) % locationPhotos.length : null)),
    [locationPhotos.length],
  );
  const next = useCallback(() => setLightboxIndex((i) => (i !== null ? (i + 1) % locationPhotos.length : null)), [locationPhotos.length]);

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
    <>
      <div className="border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
          <HugeiconsIcon icon={Image01Icon} className="size-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{t("photos.label")}</span>
          <span className="text-xs text-muted-foreground">
            {t("photos.selectionCount", { selected: selectedSet.size, total: locationPhotos.length })}
          </span>
        </div>
        <div className="p-3 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 max-h-80 overflow-y-auto">
          {locationPhotos.map((photo, idx) => {
            const isSelected = selectedSet.has(photo.id);
            const isAssigned = assignedIds.has(photo.id);

            return (
              <div
                key={photo.id}
                role="button"
                tabIndex={0}
                className={cn(
                  "rounded-lg overflow-hidden border-2 transition-colors bg-muted cursor-pointer select-none focus:outline-none",
                  isSelected ? "border-primary" : "border-transparent",
                )}
                onClick={() => toggleSelect(photo)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") toggleSelect(photo);
                }}
              >
                <div className="relative h-36">
                  <img
                    src={`/uploads/${photo.attachment_uuid}.webp`}
                    alt={photo.note ?? ""}
                    className={cn("w-full h-full object-cover transition-opacity", selectedSet.size > 0 && !isSelected && "opacity-40")}
                    loading="lazy"
                  />
                  {isAssigned && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-white rounded-sm px-1 text-[9px] font-semibold leading-4">
                      {t("photos.alreadyAssigned")}
                    </span>
                  )}
                  <button
                    type="button"
                    className="absolute top-1 right-1 size-8 sm:size-6 rounded-full bg-black/50 ring-1 ring-white/30 shadow-sm flex items-center justify-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(idx);
                    }}
                    aria-label="View full size"
                  >
                    <HugeiconsIcon icon={ZoomInAreaIcon} className="size-3 text-white" />
                  </button>
                  {isNew(photo.createdAt) ? (
                    <span className="absolute bottom-1.5 left-1.5 bg-amber-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none pointer-events-none">
                      NEW
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "absolute bottom-1 right-1 size-4 rounded-full border-2 flex items-center justify-center pointer-events-none transition-colors",
                      isSelected ? "bg-primary border-primary" : "bg-black/30 border-white/70",
                    )}
                  >
                    {isSelected && <HugeiconsIcon icon={Tick02Icon} className="size-2.5 text-primary-foreground" />}
                  </span>
                </div>
                <div className="px-2 pt-1 pb-1 text-[11px] space-y-0.5">
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

      <Lightbox photos={locationPhotos} index={lightboxIndex} onClose={closeLightbox} onPrev={prev} onNext={next} />
    </>
  );
}
