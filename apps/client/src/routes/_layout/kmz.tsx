import { Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { downloadKmzFile, KMZ_TYPES, type KmzFile, type KmzSource, type KmzType } from "@/features/kmz/api";
import { useKmzList } from "@/features/kmz/hooks";
import { regionsQueryOptions } from "@/features/shared/queries";
import { formatFileSize } from "@/lib/format";

function KmzTypeSwitcher({ type, onChange }: { type: KmzType; onChange: (type: KmzType) => void }) {
  const { t } = useTranslation("kmz");

  return (
    <ButtonGroup aria-label={t("type.label")}>
      {KMZ_TYPES.map((value) => (
        <Button
          key={value}
          type="button"
          role="tab"
          aria-selected={type === value}
          onClick={() => onChange(value)}
          variant={type === value ? "default" : "outline"}
          aria-pressed={type === value}
        >
          {t(`type.${value}`)}
        </Button>
      ))}
    </ButtonGroup>
  );
}

function KmzFileRow({
  regionLabel,
  size,
  onDownload,
  isDownloading,
}: {
  regionLabel: string;
  size: number;
  onDownload: () => void;
  isDownloading: boolean;
}) {
  const { t } = useTranslation("kmz");

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:border-primary/30">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{regionLabel}</p>
        <p className="text-xs tabular-nums text-muted-foreground">{formatFileSize(size)}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onDownload} disabled={isDownloading}>
        {isDownloading ? <Spinner /> : <HugeiconsIcon icon={Download01Icon} className="size-4.5" />}
        {isDownloading ? t("list.downloading") : t("list.download")}
      </Button>
    </div>
  );
}

function KmzListPage() {
  const { t } = useTranslation("kmz");
  const [type, setType] = useState<KmzType>("stations");
  const [source, setSource] = useState<KmzSource>("all");
  const [dateIndex, setDateIndex] = useState(0);
  const [downloadingFileName, setDownloadingFileName] = useState<string | null>(null);

  const { data, isLoading, isError } = useKmzList(type, source);
  const { data: regions = [] } = useQuery(regionsQueryOptions());

  const regionMap = useMemo(() => new Map(regions.map((region) => [region.code, region.name])), [regions]);

  const availableDates = useMemo(() => {
    const seen = new Set<string>();
    for (const file of data?.data ?? []) seen.add(file.date);
    return [...seen];
  }, [data]);

  const selectedDate = availableDates[dateIndex] ?? null;
  const filesForDate = useMemo(() => {
    if (!selectedDate) return [];
    return (data?.data ?? [])
      .filter((file) => file.date === selectedDate)
      .sort((a, b) => {
        if (a.region === b.region) return 0;
        if (a.region === null) return -1;
        if (b.region === null) return 1;
        const aRegionMap = regionMap.get(a.region) ?? a.region;
        const bRegionMap = regionMap.get(b.region) ?? b.region;

        return aRegionMap.localeCompare(bRegionMap);
      });
  }, [data, selectedDate, regionMap]);

  function handleTypeChange(nextType: KmzType) {
    setType(nextType);
    setDateIndex(0);
  }

  function handleSourceChange(nextSource: KmzSource) {
    setSource(nextSource);
    setDateIndex(0);
  }

  async function handleDownload(file: KmzFile) {
    setDownloadingFileName(file.filename);
    const success = await downloadKmzFile(file);
    if (!success) toast.error(t("downloadError"));
    setDownloadingFileName(null);
  }

  function handleRegionName(file: KmzFile) {
    if (file.filename.includes("_new")) return t(`file.new_${file.type}`);
    if (file.filename.includes("_UNKNOWN")) return t("region.unknownRegion");
    const region = file.region ? (regionMap.get(file.region) ?? file.region) : t("region.allRegions");
    return region;
  }

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="w-full px-6 py-6">
        <header className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{t("page.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("page.subtitle")}</p>
          </div>
          <p className="shrink-0 text-sm font-medium text-muted-foreground">{t("list.count", { count: filesForDate.length })}</p>
        </header>
        <KmzTypeSwitcher type={type} onChange={handleTypeChange} />

        <div className="pt-5">
          {isLoading ? (
            <Skeleton />
          ) : isError ? (
            <p>oopsie woopsie</p>
          ) : filesForDate.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filesForDate.map((file) => (
                <KmzFileRow
                  key={file.filename}
                  regionLabel={handleRegionName(file)}
                  size={file.size}
                  onDownload={() => handleDownload(file)}
                  isDownloading={downloadingFileName === file.filename}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/_layout/kmz")({
  component: KmzListPage,
});
