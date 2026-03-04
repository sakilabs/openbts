import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon, Cancel01Icon, ArrowLeft01Icon, ArrowRight01Icon, StarIcon, Note02Icon } from "@hugeicons/core-free-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { fetchStationPhotos, setMainPhoto, type StationPhoto } from "../api";

type Props = { stationId: number; isAdmin: boolean };

function PhotoMeta({ photo, locale, showNote }: { photo: StationPhoto; locale: string; showNote?: boolean }) {
  const { t } = useTranslation("stationDetails");
  const username = photo.author?.username ?? t("photos.unknownUser");
  const date = new Date(photo.createdAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <span className="truncate font-medium">@{username}</span>
      <span className="opacity-70">·</span>
      <span className="tabular-nums shrink-0">{date}</span>
      {showNote && photo.note ? (
        <>
          <span className="opacity-70">·</span>
          <span className="italic truncate opacity-70">{photo.note}</span>
        </>
      ) : null}
    </>
  );
}

export function PhotoGallery({ stationId, isAdmin }: Props) {
  const { t, i18n } = useTranslation("stationDetails");
  const queryClient = useQueryClient();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: photos, isLoading } = useQuery({
    queryKey: ["station-photos", stationId],
    queryFn: () => fetchStationPhotos(stationId),
    staleTime: 1000 * 60 * 5,
  });

  const setMainMutation = useMutation({
    mutationFn: ({ photoId }: { photoId: number }) => setMainPhoto(stationId, photoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["station-photos", stationId] }),
  });

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  useEscapeKey(closeLightbox, lightboxIndex !== null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <HugeiconsIcon icon={Image01Icon} className="size-10 mb-3 opacity-20" />
        <p className="text-sm font-medium">{t("photos.noPhotos")}</p>
        <p className="text-xs mt-1 opacity-70">{t("photos.noPhotosHint")}</p>
      </div>
    );
  }

  const prev = () => setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null));
  const next = () => setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null));

  const activePhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((photo, idx) => (
          <div key={photo.id} className="relative group">
            <img
              src={`/uploads/${photo.attachment_uuid}.webp`}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setLightboxIndex(idx)}
            />
            {photo.is_main ? (
              <span className="absolute top-1.5 left-1.5 bg-black/60 text-yellow-400 rounded-full p-1">
                <HugeiconsIcon icon={StarIcon} className="size-3" />
              </span>
            ) : null}
            {photo.note ? (
              <span className="absolute top-1.5 right-1.5 bg-black/60 text-white/80 rounded-full p-1" title={photo.note}>
                <HugeiconsIcon icon={Note02Icon} className="size-3" />
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-2 py-1.5 rounded-b-lg bg-linear-to-t from-black/70 to-transparent text-white text-[11px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <PhotoMeta photo={photo} locale={i18n.language} />
            </div>
            {isAdmin && !photo.is_main ? (
              <button
                type="button"
                onClick={() => setMainMutation.mutate({ photoId: photo.id })}
                disabled={setMainMutation.isPending}
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white rounded-md px-2 py-0.5 text-xs font-medium"
              >
                {t("photos.setAsMain")}
              </button>
            ) : null}
          </div>
        ))}
      </div>

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
              alt=""
              className="max-w-full max-h-[calc(90vh-2rem)] object-contain rounded-lg"
            />
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <PhotoMeta photo={activePhoto} locale={i18n.language} showNote />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
