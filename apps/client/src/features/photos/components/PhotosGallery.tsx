import { ArrowDown01Icon, ArrowUp01Icon, Camera01Icon, Cancel01Icon, RefreshIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Lightbox } from "@/components/lightbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { operatorsQueryOptions } from "@/features/shared/queries";
import { useStationDialogStack } from "@/features/station-details/components/stationDialogStackProvider";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getOperatorColor } from "@/lib/operatorUtils";
import { cn } from "@/lib/utils";

import type { GalleryPhoto, PhotosGalleryFilters, PhotosGalleryOrder, PhotosGallerySortBy } from "../api";
import { usePhotosGallery } from "../hooks";
import { GallerySkeleton } from "./GallerySkeleton";
import { PhotoTile } from "./PhotoTile";

const ALL_FILTER_VALUE = "__all__";

function ClearFiltersButton({ count, onClick, className }: { count: number; onClick: () => void; className?: string }) {
  const { t } = useTranslation("common");
  return (
    <Button type="button" variant="ghost" size="sm" className={cn("text-muted-foreground", className)} onClick={onClick}>
      <HugeiconsIcon icon={Cancel01Icon} className="size-3" data-icon="inline-start" />
      {t("actions.clearAll")}
      <span className="ml-1 bg-muted text-muted-foreground rounded-sm px-1.5 py-0.5 text-[10px] font-bold leading-none">{count}</span>
    </Button>
  );
}

type StationPhotoGroup = {
  stationId: number;
  stationIdentifier: string;
  operator: GalleryPhoto["station"]["operator"];
  location: GalleryPhoto["location"];
  items: { photo: GalleryPhoto; index: number }[];
};

const DEFAULT_FILTERS: PhotosGalleryFilters = {
  q: "",
  operator: null,
  sortBy: "station",
  order: "asc",
  mainOnly: false,
  recentOnly: false,
};

function groupPhotosByStation(photos: GalleryPhoto[]): StationPhotoGroup[] {
  const groups = new Map<number, StationPhotoGroup>();

  photos.forEach((photo, index) => {
    const existing = groups.get(photo.station.id);

    if (existing) {
      existing.items.push({ photo, index });
      return;
    }

    groups.set(photo.station.id, {
      stationId: photo.station.id,
      stationIdentifier: photo.station.station_id,
      operator: photo.station.operator,
      location: photo.location,
      items: [{ photo, index }],
    });
  });

  return Array.from(groups.values());
}

function getActiveFilterCount(filters: PhotosGalleryFilters) {
  return [
    filters.q.trim().length > 0,
    filters.operator !== null,
    filters.sortBy !== DEFAULT_FILTERS.sortBy,
    filters.order !== DEFAULT_FILTERS.order,
    filters.mainOnly,
    filters.recentOnly,
  ].filter(Boolean).length;
}

export function PhotosGallery() {
  const { t, i18n } = useTranslation(["main", "common"]);
  const reduceMotion = useReducedMotion();
  const { openStationDialog } = useStationDialogStack();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [operator, setOperator] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<PhotosGallerySortBy>("station");
  const [order, setOrder] = useState<PhotosGalleryOrder>("asc");
  const [mainOnly, setMainOnly] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const filters = useMemo<PhotosGalleryFilters>(
    () => ({ q: debouncedSearch, operator, sortBy, order, mainOnly, recentOnly }),
    [debouncedSearch, mainOnly, operator, order, recentOnly, sortBy],
  );

  const { data: operators = [] } = useQuery(operatorsQueryOptions());
  const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = usePhotosGallery(filters);

  const photos = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
  const stationGroups = useMemo(() => groupPhotosByStation(photos), [photos]);
  const selectedOperator = useMemo(
    () => (operator === null ? null : (operators.find((item) => item.id === operator) ?? null)),
    [operator, operators],
  );
  const sortLabels = useMemo<Record<PhotosGallerySortBy, string>>(
    () => ({
      station: t("photos.sort.station"),
      uploaded: t("photos.sort.uploaded"),
      taken: t("photos.sort.taken"),
    }),
    [t],
  );
  const totalCount = data?.pages[0]?.totalCount ?? 0;
  const loadedCount = photos.length;
  const activeFilterCount = getActiveFilterCount(filters);
  const activeFilters = activeFilterCount > 0;

  const labels = useMemo(
    () => ({
      mainPhoto: t("photos.mainPhoto"),
      openPhoto: t("photos.openPhoto"),
      recent: t("photos.recent"),
      taken: t("photos.taken"),
      unknownOperator: t("unknownOperator"),
      unknownUser: t("photos.unknownUser"),
      uploaded: t("photos.uploaded"),
      viewStation: t("photos.viewStation"),
      imageUnavailable: t("photos.imageUnavailable"),
    }),
    [t],
  );

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => setShowScrollTop(scrollElement.scrollTop > 520);
    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage && lightboxIndex === null) void fetchNextPage();
      },
      { root, rootMargin: "900px 0px", threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, lightboxIndex]);

  useEffect(() => setLightboxIndex(null), [debouncedSearch, operator, mainOnly, recentOnly]);

  const openPhoto = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const openStation = useCallback((stationId: number) => openStationDialog(stationId, "internal"), [openStationDialog]);
  const retry = useCallback(() => void refetch(), [refetch]);
  const clearFilters = useCallback(() => {
    setSearch("");
    setOperator(null);
    setSortBy(DEFAULT_FILTERS.sortBy);
    setOrder(DEFAULT_FILTERS.order);
    setMainOnly(false);
    setRecentOnly(false);
  }, []);
  const handleOperatorChange = useCallback((value: string | null) => {
    if (value === null) return;
    setOperator(value === ALL_FILTER_VALUE ? null : Number(value));
  }, []);
  const handleSortChange = useCallback((value: PhotosGallerySortBy | null) => {
    if (value === null) return;
    setSortBy(value);
  }, []);
  const toggleOrder = useCallback(() => setOrder((current) => (current === "asc" ? "desc" : "asc")), []);

  const prev = useCallback(
    () => setLightboxIndex((index) => (index !== null && photos.length > 0 ? (index - 1 + photos.length) % photos.length : index)),
    [photos.length],
  );
  const next = useCallback(
    () => setLightboxIndex((index) => (index !== null && photos.length > 0 ? (index + 1) % photos.length : index)),
    [photos.length],
  );
  const scrollToTop = useCallback(() => scrollRef.current?.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }), [reduceMotion]);

  const emptyTitle = activeFilters ? t("photos.filteredEmptyTitle") : t("photos.emptyTitle");
  const emptySubtitle = activeFilters ? t("photos.filteredEmptySubtitle") : t("photos.emptySubtitle");

  const content = isLoading ? (
    <GallerySkeleton />
  ) : isError ? (
    <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
      <HugeiconsIcon icon={Camera01Icon} className="mb-3 size-10 text-muted-foreground/50" />
      <h2 className="text-base font-semibold">{t("photos.errorTitle")}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("photos.errorSubtitle")}</p>
      <Button type="button" variant="outline" size="sm" className="mt-4 gap-2" onClick={retry}>
        <HugeiconsIcon icon={RefreshIcon} className="size-4" />
        {t("photos.retry")}
      </Button>
    </div>
  ) : photos.length === 0 ? (
    <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
      <HugeiconsIcon icon={Camera01Icon} className="mb-3 size-10 text-muted-foreground/50" />
      <h2 className="text-base font-semibold">{emptyTitle}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{emptySubtitle}</p>
      {activeFilters ? <ClearFiltersButton count={activeFilterCount} onClick={clearFilters} className="mt-4" /> : null}
    </div>
  ) : (
    <div className="space-y-7">
      {stationGroups.map((group) => (
        <section key={group.stationId} className="scroll-mt-6">
          <div className="mb-3 flex items-center gap-3">
            <button
              type="button"
              className="group/header flex min-w-0 cursor-pointer items-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => openStation(group.stationId)}
            >
              <span className="truncate text-sm font-semibold tabular-nums">{group.stationIdentifier}</span>
              {group.operator ? (
                <span className="inline-flex max-w-44 items-center gap-1.5 truncate rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-[2px]" style={{ backgroundColor: getOperatorColor(group.operator.mnc ?? 0) }} />
                  <span className="truncate">{group.operator.name}</span>
                </span>
              ) : null}
              <span className="hidden max-w-80 truncate text-xs text-muted-foreground sm:inline">{group.location.label}</span>
            </button>
            <div className="h-px min-w-6 flex-1 bg-border" />
            <span className="shrink-0 text-xs text-muted-foreground">{t("photos.stationPhotoCount", { count: group.items.length })}</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3 2xl:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
            {group.items.map(({ photo, index }) => (
              <PhotoTile key={photo.id} photo={photo} index={index} locale={i18n.language} labels={labels} onOpen={openPhoto} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="w-full">
          <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">{t("photos.title")}</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("photos.subtitle")}</p>
            </div>
            {isLoading || isError ? null : (
              <p className="text-sm text-muted-foreground">{t("photos.loadedCount", { count: loadedCount, total: totalCount })}</p>
            )}
          </header>

          <div className="mb-5 flex flex-col gap-2 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative min-w-0 flex-1 sm:max-w-96">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("photos.searchPlaceholder")}
                  className="h-8 pl-8 pr-8"
                />
                {search.length > 0 ? (
                  <button
                    type="button"
                    className="absolute right-1.5 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={t("common:actions.clear")}
                    onClick={() => setSearch("")}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                  </button>
                ) : null}
              </div>

              <Select value={operator === null ? ALL_FILTER_VALUE : String(operator)} onValueChange={handleOperatorChange}>
                <SelectTrigger className="h-8 w-full sm:w-48">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      {selectedOperator ? (
                        <span className="size-2.5 rounded-[2px]" style={{ backgroundColor: getOperatorColor(selectedOperator.mnc ?? 0) }} />
                      ) : null}
                      <span className="truncate">{selectedOperator?.name ?? t("common:labels.allOperators")}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>{t("common:labels.allOperators")}</SelectItem>
                  {operators.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-[2px]" style={{ backgroundColor: getOperatorColor(item.mnc ?? 0) }} />
                        {item.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="h-8 w-full sm:w-40">
                  <SelectValue>{sortLabels[sortBy]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="station">{sortLabels.station}</SelectItem>
                  <SelectItem value="uploaded">{sortLabels.uploaded}</SelectItem>
                  <SelectItem value="taken">{sortLabels.taken}</SelectItem>
                </SelectContent>
              </Select>

              <Button type="button" variant="outline" size="sm" className="h-8 gap-2" onClick={toggleOrder}>
                <HugeiconsIcon icon={order === "asc" ? ArrowUp01Icon : ArrowDown01Icon} className="size-4" />
                {order === "asc" ? t("photos.order.asc") : t("photos.order.desc")}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex h-8 items-center gap-2 text-sm text-muted-foreground">
                <Switch size="sm" checked={mainOnly} onCheckedChange={setMainOnly} />
                {t("photos.mainOnly")}
              </label>
              <label className="inline-flex h-8 items-center gap-2 text-sm text-muted-foreground">
                <Switch size="sm" checked={recentOnly} onCheckedChange={setRecentOnly} />
                {t("photos.recentOnly")}
              </label>
              {activeFilters ? <ClearFiltersButton count={activeFilterCount} onClick={clearFilters} /> : null}
            </div>
          </div>

          {content}

          <div ref={sentinelRef} className="h-8" aria-hidden="true" />

          {isFetchingNextPage ? (
            <div className="flex items-center justify-center gap-2 py-5 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              {t("photos.loadingMore")}
            </div>
          ) : null}
          {!hasNextPage && photos.length > 0 && !isFetchingNextPage ? (
            <p className="py-5 text-center text-sm text-muted-foreground">{t("photos.allLoaded")}</p>
          ) : null}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showScrollTop ? (
          <motion.button
            type="button"
            className={cn(
              "absolute bottom-5 right-5 inline-flex size-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-colors",
              "hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
            aria-label={t("photos.scrollTop")}
            onClick={scrollToTop}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
          >
            <HugeiconsIcon icon={ArrowUp01Icon} className="size-5" />
          </motion.button>
        ) : null}
      </AnimatePresence>

      <Lightbox photos={photos} index={lightboxIndex} onClose={closeLightbox} onPrev={prev} onNext={next} />
    </div>
  );
}
