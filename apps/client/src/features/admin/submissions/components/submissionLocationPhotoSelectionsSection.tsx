import { Camera01Icon, Image01Icon, Upload04Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { Lightbox } from "@/components/lightbox";
import type { LocationPhoto } from "@/features/station-details/api";

type Props = { photos: LocationPhoto[] };

export function SubmissionLocationPhotoSelectionsSection({ photos }: Props) {
  const { t, i18n } = useTranslation("submissions");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = () => setLightboxIndex(null);
  const prev = useCallback(() => setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null)), [photos.length]);
  const next = useCallback(() => setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null)), [photos.length]);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
          <HugeiconsIcon icon={Image01Icon} className="size-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{t("photos.selectedLocationPhotos")}</span>
          <span className="text-xs text-muted-foreground">({photos.length})</span>
        </div>
        <div className="p-3 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="rounded-lg overflow-hidden border bg-muted">
              <div
                role="button"
                tabIndex={0}
                className="relative h-36 cursor-zoom-in"
                onClick={() => setLightboxIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setLightboxIndex(idx);
                }}
              >
                <img src={`/uploads/${photo.attachment_uuid}.webp`} alt={photo.note ?? ""} className="w-full h-full object-cover" loading="lazy" />
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
