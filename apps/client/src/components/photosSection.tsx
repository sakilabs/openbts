import { useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Camera01Icon,
  Delete02Icon,
  Image01Icon,
  StarIcon,
  Upload04Icon,
  PencilEdit02Icon,
  Tick02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
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
import { Spinner } from "@/components/ui/spinner";
import { Lightbox } from "@/components/lightbox";

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
  const { t, i18n } = useTranslation("submissions");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deletePhotoId, setDeletePhotoId] = useState<number | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editTakenAt, setEditTakenAt] = useState<Date | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: queryKey as unknown[],
    queryFn: fetchFn,
    staleTime: 1000 * 60 * 2,
  });

  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;
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
      setEditingPhotoId(null);
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

  const photosLengthRef = useRef(photos.length);
  photosLengthRef.current = photos.length;

  const closeLightbox = () => setLightboxIndex(null);
  const prev = useCallback(() => setLightboxIndex((i) => (i !== null ? (i - 1 + photosLengthRef.current) % photosLengthRef.current : null)), []);
  const next = useCallback(() => setLightboxIndex((i) => (i !== null ? (i + 1) % photosLengthRef.current : null)), []);

  function openEdit(photo: Photo) {
    setEditingPhotoId(photo.id);
    setEditNote(photo.note ?? "");
    setEditTakenAt(photo.taken_at ? new Date(photo.taken_at) : null);
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

  if (!isLoading && photos.length === 0 && hideWhenEmpty) return null;

  return (
    <>
      <Collapsible defaultOpen>
        <div className="border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer select-none group">
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className="size-3.5 text-muted-foreground transition-transform group-data-panel-open:rotate-0 -rotate-90"
              />
              <HugeiconsIcon icon={Image01Icon} className="size-4 text-primary" />
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
                <HugeiconsIcon icon={Image01Icon} className="size-8 opacity-20" />
                <p>{t("photos.empty")}</p>
                {uploadFn ? (
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
                    <HugeiconsIcon icon={Upload04Icon} className="size-3.5" />
                    {t("photos.uploadFirst")}
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-96 overflow-y-auto">
                {photos.map((photo, idx) => (
                  <div key={photo.id} className="relative group rounded-lg overflow-hidden border bg-muted">
                    <div className="relative aspect-square">
                      <img
                        src={`/uploads/${photo.attachment_uuid}.webp`}
                        alt={photo.note ?? ""}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {photo.is_main ? (
                        <span className="absolute top-1 left-1 bg-amber-500 text-white rounded-full p-0.5">
                          <HugeiconsIcon icon={StarIcon} className="size-3" />
                        </span>
                      ) : null}
                      <div
                        className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-zoom-in"
                        onClick={() => setLightboxIndex(idx)}
                      >
                        {!readOnly && setMainFn && !photo.is_main ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs px-2.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMainMutation.mutate(photo.id);
                            }}
                            disabled={setMainMutation.isPending}
                          >
                            {t("photos.setAsMain")}
                          </Button>
                        ) : null}
                        {!readOnly ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletePhotoId(photo.id);
                            }}
                            className="flex items-center gap-1.5 px-3 h-7 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                          >
                            <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                            {t("photos.remove")}
                          </button>
                        ) : null}
                      </div>
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
                      {!readOnly ? (
                        <Popover
                          open={editingPhotoId === photo.id}
                          onOpenChange={(open) => {
                            if (!open) setEditingPhotoId(null);
                          }}
                        >
                          <PopoverTrigger
                            type="button"
                            onClick={() => openEdit(photo)}
                            className="mt-0.5 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
                          >
                            <HugeiconsIcon icon={PencilEdit02Icon} className="size-3" />
                          </PopoverTrigger>
                          <PopoverContent side="bottom" align="end" className="w-64 flex flex-col gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-medium text-foreground">{t("photos.note")}</label>
                              <input
                                autoFocus
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                maxLength={100}
                                placeholder={t("photos.notePlaceholder")}
                                className="h-8 rounded-md border border-input bg-background px-2 text-sm w-full"
                              />
                            </div>
                            {updateTakenAtFn ? (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-foreground">{t("photos.takenAt")}</label>
                                <DatePickerInput value={editTakenAt} onChange={setEditTakenAt} />
                              </div>
                            ) : null}
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setEditingPhotoId(null)}>
                                <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                                {t("common:actions.cancel")}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  editMutation.mutate({
                                    id: photo.id,
                                    note: editNote,
                                    takenAt: editTakenAt?.toISOString() ?? null,
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
                      ) : null}
                    </div>
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
