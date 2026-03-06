import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon, StarIcon, Tick02Icon, Upload04Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchLocationPhotos, fetchStationPhotos, setStationPhotoSelection, uploadLocationPhotos } from "@/features/station-details/api";
import type { LocationPhoto } from "@/features/station-details/api";

type Props = { stationId: number; locationId: number };

export function StationPhotoSelector({ stationId, locationId }: Props) {
  const { t } = useTranslation("submissions");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [mainId, setMainId] = useState<number | null>(null);

  useEffect(() => {
    if (!loadingStation) {
      setSelected(new Set(stationPhotos.map((p) => p.id)));
      setMainId(stationPhotos.find((p) => p.is_main)?.id ?? null);
    }
  }, [stationPhotos, loadingStation]);

  const isDirty = useMemo(() => {
    const serverIds = new Set(stationPhotos.map((p) => p.id));
    const serverMain = stationPhotos.find((p) => p.is_main)?.id ?? null;
    if (selected.size !== serverIds.size || mainId !== serverMain) return true;
    for (const id of selected) if (!serverIds.has(id)) return true;
    return false;
  }, [selected, mainId, stationPhotos]);

  const saveMutation = useMutation({
    mutationFn: () => setStationPhotoSelection(stationId, Array.from(selected), mainId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["station-photos", stationId] });
      toast.success(t("photos.selectionSaved"));
    },
    onError: () => toast.error(t("photos.selectionFailed")),
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadLocationPhotos(locationId, files),
    onSuccess: async (newPhotos) => {
      const newIds = newPhotos.map((p) => p.id);
      const mergedSelected = [...new Set([...selected, ...newIds])];
      const newMainId = locationPhotos.length === 0 ? (newIds[0] ?? null) : mainId;
      await setStationPhotoSelection(stationId, mergedSelected, newMainId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["location-photos", locationId] }),
        queryClient.invalidateQueries({ queryKey: ["station-photos", stationId] }),
      ]);
      toast.success(t("photos.uploaded"));
    },
    onError: () => toast.error(t("photos.uploadFailed")),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) uploadMutation.mutate(files);
    e.target.value = "";
  }

  const isLoading = loadingLocation || loadingStation;

  function toggleSelect(photo: LocationPhoto) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(photo.id)) {
        next.delete(photo.id);
        if (mainId === photo.id) setMainId(null);
      } else {
        next.add(photo.id);
      }
      return next;
    });
  }

  function setMain(photoId: number) {
    setMainId(photoId);
    setSelected((prev) => {
      if (prev.has(photoId)) return prev;
      const next = new Set(prev);
      next.add(photoId);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
          <HugeiconsIcon icon={Image01Icon} className="size-4 text-primary" />
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
          <HugeiconsIcon icon={Image01Icon} className="size-4 text-primary" />
          <span className="font-semibold text-sm">{t("photos.label")}</span>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground gap-2">
          <HugeiconsIcon icon={Image01Icon} className="size-8 opacity-20" />
          <p>{t("photos.emptyLocation")}</p>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleFileChange} />
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending} className="gap-1.5">
            {uploadMutation.isPending ? <Spinner className="size-3.5" /> : <HugeiconsIcon icon={Upload04Icon} className="size-3.5" />}
            {t("photos.uploadFirst")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Image01Icon} className="size-4 text-primary" />
          <span className="font-semibold text-sm">{t("photos.label")}</span>
          <span className="text-xs text-muted-foreground">
            {t("photos.selectionCount", { selected: selected.size, total: locationPhotos.length })}
          </span>
        </div>
        {isDirty && (
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="h-7 text-xs gap-1.5">
            {saveMutation.isPending ? <Spinner className="size-3" /> : <HugeiconsIcon icon={Tick02Icon} className="size-3.5" />}
            {t("photos.saveSelection")}
          </Button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleFileChange} />
      <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-96 overflow-y-auto">
        {locationPhotos.map((photo) => {
          const isSelected = selected.has(photo.id);
          const isMain = mainId === photo.id;

          return (
            <div
              key={photo.id}
              className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                isSelected ? "border-primary" : "border-transparent"
              } bg-muted`}
              onClick={() => toggleSelect(photo)}
            >
              <div className="relative aspect-square">
                <img
                  src={`/uploads/${photo.attachment_uuid}.webp`}
                  alt={photo.note ?? ""}
                  className={`w-full h-full object-cover transition-opacity ${isSelected ? "" : "opacity-40"}`}
                  loading="lazy"
                />
                {isMain && (
                  <span className="absolute top-1 left-1 bg-amber-500 text-white rounded-full p-0.5">
                    <HugeiconsIcon icon={StarIcon} className="size-3" />
                  </span>
                )}
                {isSelected && (
                  <div className="absolute top-1 right-1 size-4 rounded-full bg-primary flex items-center justify-center">
                    <HugeiconsIcon icon={Tick02Icon} className="size-2.5 text-primary-foreground" />
                  </div>
                )}
                {isSelected && !isMain && (
                  <button
                    type="button"
                    className="absolute inset-x-0 bottom-0 py-1 bg-black/60 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMain(photo.id);
                    }}
                  >
                    <HugeiconsIcon icon={StarIcon} className="size-3" />
                    {t("photos.setAsMain")}
                  </button>
                )}
              </div>
              {photo.note && <p className="px-1.5 py-0.5 text-[10px] text-muted-foreground truncate">{photo.note}</p>}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-muted/30 transition-colors disabled:opacity-50"
        >
          {uploadMutation.isPending ? <Spinner className="size-5" /> : <HugeiconsIcon icon={Upload04Icon} className="size-5 text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">{t("photos.add")}</span>
        </button>
      </div>
    </div>
  );
}
