import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, ArrowLeft01Icon, ArrowRight01Icon, Upload04Icon, Camera01Icon } from "@hugeicons/core-free-icons";
import { useEscapeKey } from "@/hooks/useEscapeKey";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
const MONTH_FORMAT: Intl.DateTimeFormatOptions = { year: "numeric", month: "short" };

export type LightboxPhoto = {
  attachment_uuid: string;
  note: string | null;
  taken_at?: string | null;
  createdAt: string;
  author: { uuid: string; username: string; name: string } | null;
};

type Props = {
  photos: LightboxPhoto[];
  index: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function Lightbox({ photos, index, onClose, onPrev, onNext }: Props) {
  const { i18n } = useTranslation();

  useEscapeKey(onClose, index !== null);

  useEffect(() => {
    if (index === null || photos.length <= 1) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, photos.length, onPrev, onNext]);

  const activePhoto = index !== null ? (photos[index] ?? null) : null;

  if (index === null || !activePhoto) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90" onClick={onClose}>
      <button type="button" className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors" onClick={onClose}>
        <HugeiconsIcon icon={Cancel01Icon} className="size-6" />
      </button>
      {photos.length > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-6" />
          </button>
          <button
            type="button"
            className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
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
        <div className="flex items-center gap-2.5 text-white/80 text-xs">
          <span className="font-medium">@{activePhoto.author?.username ?? "-"}</span>
          <div className="flex items-center gap-1.5">
            <HugeiconsIcon icon={Upload04Icon} className="size-3 opacity-60" />
            <span className="tabular-nums">{new Date(activePhoto.createdAt).toLocaleDateString(i18n.language, DATE_FORMAT)}</span>
          </div>
          {activePhoto.taken_at ? (
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Camera01Icon} className="size-3 opacity-60" />
              <span className="tabular-nums">{new Date(activePhoto.taken_at).toLocaleDateString(i18n.language, MONTH_FORMAT)}</span>
            </div>
          ) : null}
          {activePhoto.note ? <span className="italic opacity-70">{activePhoto.note}</span> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
