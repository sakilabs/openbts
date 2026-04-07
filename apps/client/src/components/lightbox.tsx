import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, ArrowLeft01Icon, ArrowRight01Icon, Upload04Icon, Camera01Icon } from "@hugeicons/core-free-icons";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { Spinner } from "@/components/ui/spinner";

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
  const [visible, setVisible] = useState(false);
  const [imgAnimClass, setImgAnimClass] = useState("opacity-0");
  const [navDirection, setNavDirection] = useState<"left" | "right" | null>(null);
  const loadedUuids = useRef<Set<string>>(new Set());

  const activePhoto = index !== null ? (photos[index] ?? null) : null;

  useEscapeKey(onClose, index !== null);

  useEffect(() => {
    if (index === null || photos.length <= 1) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setNavDirection("left");
        onPrev();
      } else if (e.key === "ArrowRight") {
        setNavDirection("right");
        onNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, photos.length, onPrev, onNext]);

  const isOpen = index !== null;
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  useEffect(() => {
    if (!activePhoto?.attachment_uuid) return;
    if (!loadedUuids.current.has(activePhoto.attachment_uuid)) setImgAnimClass("opacity-0");
  }, [activePhoto?.attachment_uuid]);

  function handleImgLoad() {
    if (activePhoto) loadedUuids.current.add(activePhoto.attachment_uuid);
    const slide = navDirection === "left" ? " slide-in-from-left-8" : navDirection === "right" ? " slide-in-from-right-8" : "";
    setImgAnimClass(`animate-in fade-in${slide} duration-200`);
  }

  if (index === null || !activePhoto) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className={`fixed inset-0 z-200 flex items-center justify-center transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="absolute inset-0 bg-black/90 cursor-pointer" onClick={onClose} />

      <button
        type="button"
        className="absolute top-3 right-3 z-10 p-2 text-white hover:bg-white/10 active:bg-white/20 active:scale-95 rounded-full transition-[colors,transform]"
        aria-label="Close"
        onClick={onClose}
      >
        <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
      </button>

      {photos.length > 1 ? (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white/80 text-xs tabular-nums px-3 py-1 rounded-full select-none pointer-events-none">
          {index + 1} / {photos.length}
        </div>
      ) : null}

      {photos.length > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-3 text-white hover:bg-white/10 active:bg-white/20 active:scale-95 rounded-full transition-[colors,transform]"
            aria-label="Previous photo"
            onClick={() => {
              setNavDirection("left");
              onPrev();
            }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-6" />
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-3 text-white hover:bg-white/10 active:bg-white/20 active:scale-95 rounded-full transition-[colors,transform]"
            aria-label="Next photo"
            onClick={() => {
              setNavDirection("right");
              onNext();
            }}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-6" />
          </button>
        </>
      ) : null}

      <div className="relative z-10 flex flex-col items-center gap-3 max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="relative flex items-center justify-center min-w-16 min-h-16">
          {imgAnimClass === "opacity-0" ? <Spinner className="absolute text-white/60 size-6" /> : null}
          <img
            key={activePhoto.attachment_uuid}
            src={`/uploads/${activePhoto.attachment_uuid}.webp`}
            alt={activePhoto.note ?? ""}
            className={`max-w-full max-h-[calc(90vh-4rem)] object-contain rounded-lg motion-reduce:transition-none ${imgAnimClass}`}
            onLoad={handleImgLoad}
          />
        </div>
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
          {activePhoto.note ? <span className="italic text-white/60">{activePhoto.note}</span> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
