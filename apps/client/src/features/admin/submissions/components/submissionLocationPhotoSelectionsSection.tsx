import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon, Image01Icon, Upload04Icon } from "@hugeicons/core-free-icons";
import { Lightbox } from "@/components/lightbox";
import type { LocationPhoto } from "@/features/station-details/api";

type Props = { photos: LocationPhoto[] };

export function SubmissionLocationPhotoSelectionsSection({ photos }: Props) {
  const { t, i18n } = useTranslation("submissions");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const photosLengthRef = useRef(photos.length);
  photosLengthRef.current = photos.length;

  const closeLightbox = () => setLightboxIndex(null);
  const prev = useCallback(() => setLightboxIndex((i) => (i !== null ? (i - 1 + photosLengthRef.current) % photosLengthRef.current : null)), []);
  const next = useCallback(() => setLightboxIndex((i) => (i !== null ? (i + 1) % photosLengthRef.current : null)), []);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
          <HugeiconsIcon icon={Image01Icon} className="size-4 text-primary" />
          <span className="font-semibold text-sm">{t("photos.selectedLocationPhotos")}</span>
          <span className="text-xs text-muted-foreground">({photos.length})</span>
        </div>
        <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="group relative rounded-lg overflow-hidden border bg-muted">
              <div className="relative aspect-square cursor-zoom-in" onClick={() => setLightboxIndex(idx)}>
                <img src={`/uploads/${photo.attachment_uuid}.webp`} alt={photo.note ?? ""} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
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
          ))}
        </div>
      </div>

      <Lightbox photos={photos} index={lightboxIndex} onClose={closeLightbox} onPrev={prev} onNext={next} />
    </>
  );
}
