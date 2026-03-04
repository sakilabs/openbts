import { useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Delete02Icon,
  Image01Icon,
  StarIcon,
  Upload04Icon,
  PencilEdit02Icon,
  Tick02Icon,
  Cancel01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
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
import { useEscapeKey } from "@/hooks/useEscapeKey";

export type Photo = {
  id: number;
  attachment_uuid: string;
  note: string | null;
  createdAt: string;
  author: { uuid: string; username: string; name: string } | null;
  is_main?: boolean;
};

type Props = {
  queryKey: readonly unknown[];
  fetchFn: () => Promise<Photo[]>;
  deleteFn: (id: number) => Promise<void>;
  updateNoteFn: (id: number, note: string) => Promise<void>;
  setMainFn?: (id: number) => Promise<void>;
  uploadFn?: (files: File[]) => Promise<unknown>;
  hideWhenEmpty?: boolean;
};

export function PhotosSection({ queryKey, fetchFn, deleteFn, updateNoteFn, setMainFn, uploadFn, hideWhenEmpty }: Props) {
  const { t, i18n } = useTranslation("submissions");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deletePhotoId, setDeletePhotoId] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteValue, setNoteValue] = useState("");
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

  const noteMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => updateNoteFn(id, note),
    onSuccess: () => {
      void invalidate();
      setEditingNoteId(null);
    },
    onError: () => toast.error(t("photos.noteFailed", { defaultValue: "Failed to update note" })),
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

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  useEscapeKey(closeLightbox, lightboxIndex !== null);

  const prev = useCallback(() => setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null)), [photos.length]);
  const next = useCallback(() => setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null)), [photos.length]);
  const activePhoto = lightboxIndex !== null ? (photos[lightboxIndex] ?? null) : null;

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
              <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
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
                        {setMainFn && !photo.is_main ? (
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
                      </div>
                    </div>

                    <div className="px-2 py-1 text-[11px] text-muted-foreground">
                      <p className="truncate font-medium">@{photo.author?.username ?? "-"}</p>
                      <p className="tabular-nums">
                        {new Date(photo.createdAt).toLocaleDateString(i18n.language, { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>

                    {editingNoteId === photo.id ? (
                      <div className="px-2 pb-1.5 flex items-center gap-1">
                        <input
                          autoFocus
                          value={noteValue}
                          onChange={(e) => setNoteValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") noteMutation.mutate({ id: photo.id, note: noteValue });
                            if (e.key === "Escape") setEditingNoteId(null);
                          }}
                          maxLength={100}
                          placeholder={t("photos.notePlaceholder", { defaultValue: "Add note..." })}
                          className="flex-1 min-w-0 text-[11px] px-1.5 py-0.5 rounded border bg-background"
                        />
                        <button
                          type="button"
                          onClick={() => noteMutation.mutate({ id: photo.id, note: noteValue })}
                          disabled={noteMutation.isPending}
                          className="p-0.5 text-primary hover:text-primary/80"
                        >
                          <HugeiconsIcon icon={Tick02Icon} className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => setEditingNoteId(null)} className="p-0.5 text-muted-foreground hover:text-foreground">
                          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteId(photo.id);
                          setNoteValue(photo.note ?? "");
                        }}
                        className="px-2 pb-1.5 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full text-left truncate"
                      >
                        <HugeiconsIcon icon={PencilEdit02Icon} className="size-3 shrink-0" />
                        <span className="truncate">{photo.note || t("photos.addNote", { defaultValue: "Add note..." })}</span>
                      </button>
                    )}
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

      {lightboxIndex !== null && activePhoto ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90" onClick={closeLightbox}>
          <button
            type="button"
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={closeLightbox}
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-6" />
          </button>
          {photos.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-6" />
              </button>
              <button
                type="button"
                className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-6" />
              </button>
            </>
          ) : null}
          <div className="flex flex-col items-center gap-3 max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={`/uploads/${activePhoto.attachment_uuid}.webp`}
              alt={activePhoto.note ?? ""}
              className="max-w-full max-h-[calc(90vh-4rem)] object-contain rounded-lg"
            />
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <span className="font-medium">@{activePhoto.author?.username ?? "-"}</span>
              {activePhoto.note ? (
                <>
                  <span className="opacity-50">·</span>
                  <span className="italic opacity-70">{activePhoto.note}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
