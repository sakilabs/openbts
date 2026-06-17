import { Image01Icon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { Lightbox } from "@/components/lightbox";
import { PhotoMeta } from "@/components/photoGridPrimitives";
import type { SubmissionLocationPhoto } from "@/features/admin/submissions/types";

type Props = { photos: SubmissionLocationPhoto[] };

export function SubmissionLocationPhotoSelectionsSection({ photos }: Props) {
  const { t, i18n } = useTranslation("submissions");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
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
                {photo.is_main && (
                  <span className="absolute top-1 left-1 bg-amber-500 text-white rounded-full p-0.5" title={t("photos.setAsMain")}>
                    <HugeiconsIcon icon={StarIcon} className="size-3" />
                  </span>
                )}
              </div>
              <PhotoMeta photo={photo} locale={i18n.language} className="text-[10px]" />
            </div>
          ))}
        </div>
      </div>

      <Lightbox photos={photos} index={lightboxIndex} onClose={closeLightbox} onPrev={prev} onNext={next} />
    </>
  );
}
