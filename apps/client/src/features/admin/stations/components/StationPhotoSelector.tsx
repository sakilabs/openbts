import { useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon, Cancel01Icon, Image01Icon, PencilEdit02Icon, StarIcon, Tick02Icon, Upload04Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchLocationPhotos,
  fetchStationPhotos,
  setStationPhotoSelection,
  uploadLocationPhotos,
  updateLocationPhotoNote,
  updateLocationPhotoTakenAt,
} from "@/features/station-details/api";
import type { LocationPhoto } from "@/features/station-details/api";

type Props = { stationId: number; locationId: number };

export function StationPhotoSelector({ stationId, locationId }: Props) {
  const { t, i18n } = useTranslation("submissions");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

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

  const [selectedOverride, setSelectedOverride] = useState<Set<number> | null>(null);
  const [mainIdOverride, setMainIdOverride] = useState<number | null | "unset">("unset");

  const selected = useMemo(() => selectedOverride ?? new Set(stationPhotos.map((p) => p.id)), [selectedOverride, stationPhotos]);
  const mainId = mainIdOverride === "unset" ? (stationPhotos.find((p) => p.is_main)?.id ?? null) : mainIdOverride;

  const [editState, setEditState] = useState<{ id: number; note: string; takenAt: Date | null } | null>(null);

  const editMutation = useMutation({
    mutationFn: async ({
      id,
      note,
      takenAt,
      originalNote,
      originalTakenAt,
    }: {
      id: number;
      note: string;
      takenAt: string | null;
      originalNote: string;
      originalTakenAt: string | null;
    }) => {
      const ops: Promise<void>[] = [];
      if (note !== originalNote) ops.push(updateLocationPhotoNote(locationId, id, note));
      if (takenAt !== originalTakenAt) ops.push(updateLocationPhotoTakenAt(locationId, id, takenAt));
      if (ops.length > 0) await Promise.all(ops);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["location-photos", locationId] });
      setEditState(null);
    },
    onError: () => toast.error(t("photos.noteFailed")),
  });

  function openEdit(photo: LocationPhoto, e: React.MouseEvent) {
    e.stopPropagation();
    setEditState({ id: photo.id, note: photo.note ?? "", takenAt: photo.taken_at ? new Date(photo.taken_at) : null });
  }

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
      setSelectedOverride(null);
      setMainIdOverride("unset");
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
      setSelectedOverride(null);
      setMainIdOverride("unset");
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

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragging(true);
  }

  function handleDragLeave() {
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) uploadMutation.mutate(files);
  }

  const isLoading = loadingLocation || loadingStation;

  function toggleSelect(photo: LocationPhoto) {
    const next = new Set(selected);
    if (next.has(photo.id)) {
      next.delete(photo.id);
      if (mainId === photo.id) setMainIdOverride(null);
    } else {
      next.add(photo.id);
    }
    setSelectedOverride(next);
  }

  function setMain(photoId: number) {
    setMainIdOverride(photoId);
    if (!selected.has(photoId)) {
      const next = new Set(selected);
      next.add(photoId);
      setSelectedOverride(next);
    }
  }

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
      <div
        className={`border rounded-xl overflow-hidden transition-colors ${isDragging ? "ring-2 ring-primary border-primary bg-primary/5" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
          <HugeiconsIcon icon={Image01Icon} className="size-4 text-muted-foreground" />
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
    <div
      className={`border rounded-xl overflow-hidden transition-colors ${isDragging ? "ring-2 ring-primary border-primary bg-primary/5" : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Image01Icon} className="size-4 text-muted-foreground" />
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
              <div className="px-2 pt-1.5 pb-1 text-[10px] flex items-start justify-between gap-1">
                <div className="min-w-0 space-y-0.5">
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
                <Popover
                  open={editState?.id === photo.id}
                  onOpenChange={(open) => {
                    if (!open) setEditState(null);
                  }}
                >
                  <PopoverTrigger
                    type="button"
                    onClick={(e) => openEdit(photo, e)}
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
                  >
                    <HugeiconsIcon icon={PencilEdit02Icon} className="size-3" />
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="end" className="w-64 flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-foreground">{t("photos.note")}</label>
                      <input
                        value={editState?.note ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setEditState((prev) => (prev ? { ...prev, note: v } : prev));
                        }}
                        maxLength={100}
                        placeholder={t("photos.notePlaceholder")}
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-foreground">{t("photos.takenAt")}</label>
                      <DatePickerInput
                        value={editState?.takenAt ?? null}
                        onChange={(v) => setEditState((prev) => (prev ? { ...prev, takenAt: v } : prev))}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditState(null)}>
                        <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                        {t("common:actions.cancel")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          editMutation.mutate({
                            id: photo.id,
                            note: editState?.note ?? "",
                            takenAt: editState?.takenAt?.toISOString() ?? null,
                            originalNote: photo.note ?? "",
                            originalTakenAt: photo.taken_at ?? null,
                          })
                        }
                        disabled={editMutation.isPending}
                      >
                        {editMutation.isPending ? <Spinner className="size-3" /> : <HugeiconsIcon icon={Tick02Icon} className="size-3.5" />}
                        {t("common:actions.save")}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
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
