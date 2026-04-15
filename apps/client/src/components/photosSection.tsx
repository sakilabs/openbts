import {
  ArrowDown01Icon,
  Cancel01Icon,
  Delete02Icon,
  Image01Icon,
  PencilEdit02Icon,
  StarIcon,
  Tick02Icon,
  Upload04Icon,
  ZoomInAreaIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Lightbox } from "@/components/lightbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
function isNew(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < SEVEN_DAYS_MS;
}

export type Photo = {
  id: number;
  attachment_uuid: string;
  note: string | null;
  taken_at?: string | null;
  createdAt: string;
  author: { uuid: string; username: string; name: string } | null;
  is_main?: boolean;
};

type Props = {
  queryKey: readonly unknown[];
  fetchFn: () => Promise<Photo[]>;
  deleteFn: (id: number) => Promise<void>;
  updateNoteFn: (id: number, note: string) => Promise<void>;
  updateTakenAtFn?: (id: number, takenAt: string | null) => Promise<void>;
  setMainFn?: (id: number) => Promise<void>;
  uploadFn?: (files: File[]) => Promise<unknown>;
  hideWhenEmpty?: boolean;
  readOnly?: boolean;
};

export function PhotosSection({ queryKey, fetchFn, deleteFn, updateNoteFn, updateTakenAtFn, setMainFn, uploadFn, hideWhenEmpty, readOnly }: Props) {
  const { t } = useTranslation("submissions");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const [deletePhotoId, setDeletePhotoId] = useState<number | null>(null);
  const [editState, setEditState] = useState<{ id: number; note: string; takenAt: Date | null } | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: queryKey as unknown[],
    queryFn: fetchFn,
    staleTime: 1000 * 60 * 2,
  });

  const queryKeyRef = useRef(queryKey);
  useLayoutEffect(() => {
    queryKeyRef.current = queryKey;
  });
  const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: queryKeyRef.current as unknown[] }), [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      void invalidate();
      toast.success(t("photos.deleted"));
    },
    onError: () => toast.error(t("photos.deleteFailed")),
  });

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
      if (note !== originalNote) ops.push(updateNoteFn(id, note));
      if (updateTakenAtFn && takenAt !== originalTakenAt) ops.push(updateTakenAtFn(id, takenAt));
      if (ops.length > 0) await Promise.all(ops);
    },
    onSuccess: () => {
      void invalidate();
      setEditState(null);
    },
    onError: () => toast.error(t("photos.noteFailed")),
  });

  const setMainMutation = useMutation({
    mutationFn: (id: number) => {
      if (!setMainFn) throw new Error("setMainFn is not provided");
      return setMainFn(id);
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error(t("photos.setMainFailed")),
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => {
      if (!uploadFn) throw new Error("uploadFn is not provided");
      return uploadFn(files);
    },
    onSuccess: () => {
      void invalidate();
      toast.success(t("photos.uploaded"));
    },
    onError: () => toast.error(t("photos.uploadFailed")),
  });

  const closeLightbox = () => setLightboxIndex(null);
  const prev = useCallback(() => setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null)), [photos.length]);
  const next = useCallback(() => setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null)), [photos.length]);

  function openEdit(photo: Photo) {
    setEditState({ id: photo.id, note: photo.note ?? "", takenAt: photo.taken_at ? new Date(photo.taken_at) : null });
  }

  function confirmDelete() {
    if (deletePhotoId === null) return;
    deleteMutation.mutate(deletePhotoId);
    setDeletePhotoId(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) uploadMutation.mutate(files);
    e.target.value = "";
  }

  function handleDragEnter(e: React.DragEvent) {
    if (!uploadFn) return;
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragging(true);
  }

  function handleDragLeave() {
    if (!uploadFn) return;
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }

  function handleDragOver(e: React.DragEvent) {
    if (!uploadFn) return;
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    if (!uploadFn) return;
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) uploadMutation.mutate(files);
  }

  if (!isLoading && photos.length === 0 && hideWhenEmpty) return null;

  return (
    <>
      <Collapsible defaultOpen>
        <div
          className={cn("border rounded-xl overflow-hidden transition-colors", isDragging ? "ring-2 ring-primary border-primary bg-primary/5" : "")}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer select-none group">
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className="size-3.5 text-muted-foreground transition-transform group-data-panel-open:rotate-0 -rotate-90"
              />
              <HugeiconsIcon icon={Image01Icon} className="size-4 text-muted-foreground" />
              <span className="font-semibold text-sm">{t("photos.label")}</span>
              {!isLoading ? <span className="text-xs text-muted-foreground">({photos.length})</span> : null}
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            {uploadFn ? <input ref={fileInputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleFileChange} /> : null}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground gap-2">
                <HugeiconsIcon icon={Image01Icon} className="size-8 opacity-40" />
                <p>{t("photos.empty")}</p>
                {uploadFn ? (
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
                    <HugeiconsIcon icon={Upload04Icon} className="size-3.5" />
                    {t("photos.uploadFirst")}
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto custom-scrollbar">
                {photos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="rounded-lg overflow-hidden border bg-muted animate-in fade-in zoom-in-95 duration-300 motion-reduce:animate-none"
                    style={{ animationDelay: `${Math.min(idx * 40, 400)}ms`, animationFillMode: "both" }}
                  >
                    <div className="relative aspect-square">
                      <img
                        src={`/uploads/${photo.attachment_uuid}.webp`}
                        alt={photo.note ?? ""}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                      {photo.is_main ? (
                        <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white rounded-full p-0.5">
                          <HugeiconsIcon icon={StarIcon} className="size-3" />
                        </span>
                      ) : null}
                      <button
                        type="button"
                        className="absolute top-1 right-1 size-8 sm:size-6 rounded-full bg-black/50 ring-1 ring-white/30 shadow-sm flex items-center justify-center cursor-pointer"
                        onClick={() => setLightboxIndex(idx)}
                        aria-label="View full size"
                      >
                        <HugeiconsIcon icon={ZoomInAreaIcon} className="size-3 text-white" />
                      </button>
                      {isNew(photo.createdAt) ? (
                        <span className="absolute bottom-1.5 left-1.5 bg-amber-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none">
                          NEW
                        </span>
                      ) : null}
                    </div>
                    {!readOnly ? (
                      <div className={cn("border-t divide-x", setMainFn && !photo.is_main ? "grid grid-cols-3" : "grid grid-cols-2")}>
                        {setMainFn && !photo.is_main ? (
                          <button
                            type="button"
                            className="flex items-center justify-center py-2 text-xs text-muted-foreground hover:text-amber-500 hover:bg-accent transition-colors disabled:opacity-50"
                            onClick={() => setMainMutation.mutate(photo.id)}
                            disabled={setMainMutation.isPending}
                            title={t("photos.setAsMain")}
                          >
                            <HugeiconsIcon icon={StarIcon} className="size-3.5" />
                          </button>
                        ) : null}
                        <Popover
                          open={editState?.id === photo.id}
                          onOpenChange={(open) => {
                            if (!open) setEditState(null);
                          }}
                        >
                          <PopoverTrigger
                            type="button"
                            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            onClick={() => openEdit(photo)}
                          >
                            <HugeiconsIcon icon={PencilEdit02Icon} className="size-3.5" />
                            {t("common:actions.edit")}
                          </PopoverTrigger>
                          <PopoverContent side="bottom" align="end" className="w-64 flex flex-col gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-medium text-foreground">{t("photos.note")}</label>
                              <Input
                                value={editState?.note ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setEditState((prev) => (prev ? { ...prev, note: v } : prev));
                                }}
                                maxLength={100}
                                placeholder={t("photos.notePlaceholder")}
                              />
                            </div>
                            {updateTakenAtFn ? (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-foreground">{t("photos.takenAt")}</label>
                                <DatePickerInput
                                  value={editState?.takenAt ?? null}
                                  onChange={(v) => setEditState((prev) => (prev ? { ...prev, takenAt: v } : prev))}
                                />
                              </div>
                            ) : null}
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
                        <button
                          type="button"
                          onClick={() => setDeletePhotoId(photo.id)}
                          className="flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-destructive hover:bg-accent transition-colors"
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                          {t("photos.remove")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}

                {uploadFn ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                    className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-muted/30 transition-colors disabled:opacity-50"
                  >
                    {uploadMutation.isPending ? (
                      <Spinner className="size-5" />
                    ) : (
                      <HugeiconsIcon icon={Upload04Icon} className="size-5 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">{t("photos.add")}</span>
                  </button>
                ) : null}
              </div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>

      <AlertDialog
        open={deletePhotoId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletePhotoId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("photos.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("photos.confirmDeleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Spinner /> : t("photos.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Lightbox photos={photos} index={lightboxIndex} onClose={closeLightbox} onPrev={prev} onNext={next} />
    </>
  );
}
