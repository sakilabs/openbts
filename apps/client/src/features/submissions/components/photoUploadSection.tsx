import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Delete02Icon, Image01Icon, Upload04Icon } from "@hugeicons/core-free-icons";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

const MAX_FILES = 5;
const MAX_SIZE_BYTES = 3 * 1024 * 1024;

type Props = {
  photos: File[];
  onPhotosChange: (files: File[]) => void;
  notes: string[];
  onNotesChange: (notes: string[]) => void;
};

export function PhotoUploadSection({ photos, onPhotosChange, notes, onNotesChange }: Props) {
  const { t } = useTranslation("submissions");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photos]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => f.size <= MAX_SIZE_BYTES);
    const combined = [...photos, ...valid].slice(0, MAX_FILES);
    const combinedNotes = [...notes, ...valid.map(() => "")].slice(0, MAX_FILES);
    onPhotosChange(combined);
    onNotesChange(combinedNotes);
    e.target.value = "";
  }

  function removePhoto(idx: number) {
    onPhotosChange(photos.filter((_, i) => i !== idx));
    onNotesChange(notes.filter((_, i) => i !== idx));
  }

  function updateNote(idx: number, value: string) {
    const updated = [...notes];
    updated[idx] = value;
    onNotesChange(updated);
  }

  return (
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
            <span className="text-xs text-muted-foreground">
              ({photos.length}/{MAX_FILES})
            </span>
          </CollapsibleTrigger>

          <input ref={fileInputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleFileChange} />
        </div>

        <CollapsibleContent>
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground gap-2">
              <HugeiconsIcon icon={Image01Icon} className="size-8 opacity-20" />
              <p>{t("photos.empty")}</p>
              <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
                <HugeiconsIcon icon={Upload04Icon} className="size-3.5" />
                {t("photos.add")}
              </Button>
            </div>
          ) : (
            <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {photos.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="rounded-lg overflow-hidden border bg-muted">
                  <div className="relative group aspect-square">
                    <img src={previewUrls[idx]} alt={file.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="flex items-center gap-1.5 px-3 h-7 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                        {t("photos.remove")}
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={notes[idx] ?? ""}
                    onChange={(e) => updateNote(idx, e.target.value)}
                    maxLength={100}
                    placeholder={t("photos.notePlaceholder")}
                    className="w-full px-2 py-1.5 text-[11px] bg-transparent border-t placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                </div>
              ))}
              {photos.length < MAX_FILES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-muted/30 transition-colors"
                >
                  <HugeiconsIcon icon={Upload04Icon} className="size-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t("photos.add")}</span>
                </button>
              )}
            </div>
          )}
          <p className="px-3 pb-2 text-xs text-muted-foreground">{t("photos.hint", { max: MAX_FILES, size: "3 MB" })}</p>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
