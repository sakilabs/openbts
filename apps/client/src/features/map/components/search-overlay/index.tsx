import { useState, useRef, useMemo, useCallback, memo, type FocusEvent, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon, SlidersHorizontalIcon, FilterIcon } from "@hugeicons/core-free-icons";
import { cn, toggleValue } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Station, StationFilters } from "@/types/station";
import { searchLocations, searchStations } from "../../searchApi";
import { operatorsQueryOptions, bandsQueryOptions } from "@/features/shared/queries";
import { AutocompleteDropdown } from "./autocompleteDropdown";
import { FilterPanel } from "./filterPanel";
import { SearchResults } from "./searchResults";
import { MapStyleSwitcher } from "./mapStyleSwitcher";
import { MapCursorInfo } from "../mapCursorInfo";
import { FILTER_KEYWORDS, RAT_OPTIONS, UKE_RAT_OPTIONS } from "../../constants";
import { parseFilters } from "../../filters";
import { useSearchState } from "../../hooks/useSearchState";
import { useIsMobile } from "@/hooks/useMobile";
import i18n from "@/i18n/config";
import { Spinner } from "@/components/ui/spinner";

type MapSearchOverlayProps = {
  locationCount: number;
  totalCount: number;
  radioLineCount?: number;
  radioLineTotalCount?: number;
  isRadioLinesFetching?: boolean;
  isLoading: boolean;
  isFetching?: boolean;
  filters: StationFilters;
  zoom?: number;
  activeMarker?: { latitude: number; longitude: number } | null;
  onFiltersChange: (filters: StationFilters) => void;
  onLocationSelect?: (lat: number, lon: number) => void;
  onStationSelect?: (station: Station) => void;
};

export const MapSearchOverlay = memo(function MapSearchOverlay({
  locationCount,
  totalCount,
  radioLineCount = 0,
  radioLineTotalCount = 0,
  isRadioLinesFetching = false,
  isLoading,
  isFetching = false,
  filters,
  zoom,
  activeMarker,
  onFiltersChange,
  onLocationSelect,
  onStationSelect,
}: MapSearchOverlayProps) {
  const { t } = useTranslation("main");
  const [showFilters, setShowFilters] = useState(false);
  const filterPanelRef = useRef<HTMLFieldSetElement>(null);
  const isMobile = useIsMobile();

  const mapFilterKeywords = useMemo(() => FILTER_KEYWORDS.filter((kw) => kw.availableOn.includes("map")), []);

  const [mobileExpanded, setMobileExpanded] = useState(false);

  const {
    query,
    inputValue,
    debouncedQuery,
    isFocused,
    searchMode,
    parsedFilters,
    autocompleteOptions,
    activeOverlay,
    containerRef,
    inputRef,
    handleContainerBlur,
    handleInputChange,
    handleInputFocus,
    handleInputClick,
    applyAutocomplete,
    clearSearch,
    removeFilter,
    closeOverlay,
  } = useSearchState({ filterKeywords: mapFilterKeywords, parseFilters });

  const { data: operators = [] } = useQuery(operatorsQueryOptions());

  const { data: bands = [] } = useQuery(bandsQueryOptions());

  const searchKeyword = parseFilters(debouncedQuery).remainingText;

  const shouldSearchOsm = searchKeyword.trim().length >= 3 && activeOverlay !== "autocomplete" && autocompleteOptions.length === 0;

  const { data: osmResults = [], isLoading: isOsmLoading } = useQuery({
    queryKey: ["osm-search", searchKeyword],
    queryFn: () => searchLocations(searchKeyword),
    enabled: shouldSearchOsm,
    staleTime: 1000 * 60 * 60,
  });

  const { data: stationResults = [], isLoading: isStationSearchLoading } = useQuery({
    queryKey: ["station-search", debouncedQuery],
    queryFn: () => searchStations(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const isSearching = isOsmLoading || isStationSearchLoading;
  const activeFilterCount =
    filters.operators.length +
    filters.bands.length +
    filters.rat.length +
    (filters.recentDays !== null ? 1 : 0) +
    (filters.showRadiolines ? (filters.radiolineOperators?.length ?? 0) : 0);
  const showAutocomplete = activeOverlay === "autocomplete" && autocompleteOptions.length > 0;
  const showResults = activeOverlay === "results" && (isSearching || osmResults.length > 0 || stationResults.length > 0);
  const hasMoreLocations = totalCount > locationCount;
  const hasMoreRadioLines = radioLineTotalCount > radioLineCount;

  const uniqueBandValues = useMemo(() => {
    const values = [...new Set(bands.map((b) => b.value))];
    return values.sort((a, b) => a - b);
  }, [bands]);

  function handleFilterPanelBlur(e: FocusEvent) {
    const relatedTarget = e.relatedTarget as Node | null;
    const isInsidePanel = filterPanelRef.current?.contains(relatedTarget);
    const isToggleButton = (relatedTarget as Element)?.closest("[data-filter-toggle]");

    if (!isInsidePanel && !isToggleButton) {
      setShowFilters(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      if (activeOverlay) {
        closeOverlay();
      } else {
        inputRef.current?.blur();
        setShowFilters(false);
      }
    }
    if (e.key === "Enter" && activeOverlay === "autocomplete" && autocompleteOptions.length > 0) {
      e.preventDefault();
      applyAutocomplete(autocompleteOptions[0].key);
    }
  }

  const handleToggleOperator = useCallback(
    (mnc: number) => onFiltersChange({ ...filters, operators: toggleValue(filters.operators, mnc) }),
    [filters, onFiltersChange],
  );

  const handleToggleBand = useCallback(
    (value: number) => onFiltersChange({ ...filters, bands: toggleValue(filters.bands, value) }),
    [filters, onFiltersChange],
  );

  const handleToggleRat = useCallback(
    (rat: string) => onFiltersChange({ ...filters, rat: toggleValue(filters.rat, rat) }),
    [filters, onFiltersChange],
  );

  const handleSelectAllRats = useCallback(
    () => onFiltersChange({ ...filters, rat: (filters.source === "uke" ? UKE_RAT_OPTIONS : RAT_OPTIONS).map((r) => r.value) }),
    [filters, onFiltersChange],
  );

  const handleClearAllRats = useCallback(() => onFiltersChange({ ...filters, rat: [] }), [filters, onFiltersChange]);

  const handleSelectAllBands = useCallback(
    () => onFiltersChange({ ...filters, bands: uniqueBandValues }),
    [filters, onFiltersChange, uniqueBandValues],
  );

  const handleClearAllBands = useCallback(() => onFiltersChange({ ...filters, bands: [] }), [filters, onFiltersChange]);

  const handleRecentDaysChange = useCallback((days: number | null) => onFiltersChange({ ...filters, recentDays: days }), [filters, onFiltersChange]);

  const handleClearFilters = useCallback(
    () =>
      onFiltersChange({
        operators: [],
        bands: [],
        rat: [],
        source: filters.source,
        recentDays: null,
        showStations: filters.showStations,
        showRadiolines: filters.showRadiolines,
        radiolineOperators: [],
      }),
    [filters.source, filters.showStations, filters.showRadiolines, onFiltersChange],
  );

  return (
    <>
      <div className={cn("absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-105 z-10", showFilters && "z-20")}>
        <search
          ref={containerRef}
          onBlur={(e) => {
            handleContainerBlur(e);
            if (!containerRef.current?.contains(e.relatedTarget as Node)) setMobileExpanded(false);
          }}
          className={cn(
            "bg-background/95 backdrop-blur-md border rounded-2xl shadow-xl transition-all duration-200",
            isFocused && "ring-2 ring-primary/20 border-primary/30",
            !mobileExpanded && !isFocused && "md:w-auto w-fit ml-auto",
          )}
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <button
              type="button"
              className="md:pointer-events-none shrink-0"
              onClick={() => {
                setMobileExpanded(true);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
            >
              <HugeiconsIcon icon={Search01Icon} className="size-5 text-muted-foreground" />
            </button>

            <div className={cn("flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide", !mobileExpanded && !isFocused && "hidden md:flex")}>
              {parsedFilters.map((filter) => (
                <div
                  key={filter.raw}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium border border-primary/20 shrink-0"
                >
                  <span className="font-mono text-xs whitespace-nowrap">{filter.key}:</span>
                  <span className="text-xs whitespace-nowrap max-w-30 truncate" title={filter.value}>
                    {filter.value}
                  </span>
                  <button onClick={() => removeFilter(filter)} className="hover:bg-primary/20 rounded p-0.5 transition-colors ml-0.5" type="button">
                    <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                  </button>
                </div>
              ))}

              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                onClick={handleInputClick}
                placeholder={parsedFilters.length > 0 ? t("search.placeholderAddMore") : t("common:placeholder.search")}
                className="flex-1 min-w-25 bg-transparent text-base md:text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>

            {isSearching && query.trim() !== "" && <Spinner className="size-4 text-primary shrink-0" />}

            {(query || parsedFilters.length > 0) && !isSearching && (
              <button
                onClick={clearSearch}
                className={cn("p-1.5 hover:bg-muted rounded-lg transition-colors shrink-0", !mobileExpanded && !isFocused && "hidden md:block")}
                type="button"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4 text-muted-foreground" />
              </button>
            )}

            <div className="h-6 w-px bg-border shrink-0" />

            <button
              data-filter-toggle
              onClick={() => setShowFilters(!showFilters)}
              onMouseDown={(e) => e.preventDefault()}
              type="button"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all font-medium text-sm shrink-0 whitespace-nowrap",
                showFilters || activeFilterCount > 0
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground",
              )}
            >
              <HugeiconsIcon icon={SlidersHorizontalIcon} className="size-4" />
              <span className="hidden sm:inline">{t("common:labels.filters")}</span>
              {activeFilterCount > 0 && (
                <span
                  className={cn(
                    "text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1.5",
                    showFilters || activeFilterCount > 0 ? "bg-primary-foreground/20" : "bg-primary text-primary-foreground",
                  )}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {showAutocomplete && <AutocompleteDropdown options={autocompleteOptions} onSelect={applyAutocomplete} />}

          {showResults && (
            <SearchResults
              show
              isLoading={isSearching}
              osmResults={osmResults}
              stationResults={stationResults}
              onLocationSelect={onLocationSelect}
              onStationSelect={onStationSelect}
              onClose={closeOverlay}
            />
          )}
        </search>

        {showFilters && !isMobile && (
          <fieldset ref={filterPanelRef} onBlur={handleFilterPanelBlur} tabIndex={-1}>
            <FilterPanel
              filters={filters}
              operators={operators}
              uniqueBandValues={uniqueBandValues}
              activeFilterCount={activeFilterCount}
              onFiltersChange={onFiltersChange}
              onToggleOperator={handleToggleOperator}
              onToggleBand={handleToggleBand}
              onToggleRat={handleToggleRat}
              onRecentDaysChange={handleRecentDaysChange}
              onSelectAllRats={handleSelectAllRats}
              onClearAllRats={handleClearAllRats}
              onSelectAllBands={handleSelectAllBands}
              onClearAllBands={handleClearAllBands}
              onClearFilters={handleClearFilters}
            />
          </fieldset>
        )}
      </div>

      {isMobile && (
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetContent side="bottom" className="max-h-[85dvh] flex flex-col gap-0 p-0 rounded-t-2xl" showCloseButton={false}>
            <SheetHeader className="px-4 py-3 border-b bg-muted/30 shrink-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2 text-sm">
                  <HugeiconsIcon icon={FilterIcon} className="size-4 shrink-0" />
                  <span>{t("common:labels.filters")}</span>
                </SheetTitle>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("common:actions.clearAll")}
                  </button>
                )}
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <FilterPanel
                filters={filters}
                operators={operators}
                uniqueBandValues={uniqueBandValues}
                activeFilterCount={activeFilterCount}
                onFiltersChange={onFiltersChange}
                onToggleOperator={handleToggleOperator}
                onToggleBand={handleToggleBand}
                onToggleRat={handleToggleRat}
                onRecentDaysChange={handleRecentDaysChange}
                onSelectAllRats={handleSelectAllRats}
                onClearAllRats={handleClearAllRats}
                onSelectAllBands={handleSelectAllBands}
                onClearAllBands={handleClearAllBands}
                onClearFilters={handleClearFilters}
                isSheet
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <div className="hidden md:flex absolute top-4 left-4 z-10 flex-col items-start gap-1.5">
        <div className="flex items-center gap-1.5">
          <div className="flex items-stretch shadow-xl rounded-lg overflow-hidden border bg-background/95 backdrop-blur-md">
            {filters.showStations && (
              <Tooltip>
                <TooltipTrigger
                  className={cn("px-2 py-1.5 flex items-center gap-2 border-r border-border/50", hasMoreLocations && "cursor-help")}
                  disabled={!hasMoreLocations}
                >
                  {isLoading || isFetching ? (
                    <Spinner className="size-3 text-primary" />
                  ) : hasMoreLocations ? (
                    <div className="size-1.5 rounded-full shrink-0 bg-amber-500 animate-pulse" />
                  ) : (
                    <div className="size-1.5 rounded-full shrink-0 bg-emerald-500" />
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className={cn("text-sm font-bold tabular-nums leading-none tracking-tight", hasMoreLocations && "text-amber-500")}>
                      {locationCount.toLocaleString(i18n.language)}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground leading-none uppercase tracking-wider">{t("overlay.locations")}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">{t("overlay.moreStations", { total: totalCount, shown: locationCount })}</TooltipContent>
              </Tooltip>
            )}
            {(radioLineCount > 0 || isRadioLinesFetching) && (
              <Tooltip>
                <TooltipTrigger
                  className={cn("px-2 py-1.5 flex items-center gap-2 border-r border-border/50", hasMoreRadioLines && "cursor-help")}
                  disabled={!hasMoreRadioLines}
                >
                  {isRadioLinesFetching ? (
                    <Spinner className="size-3 text-primary" />
                  ) : hasMoreRadioLines ? (
                    <div className="size-1.5 rounded-full shrink-0 bg-amber-500 animate-pulse" />
                  ) : (
                    <div className="size-1.5 rounded-full shrink-0 bg-emerald-500" />
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className={cn("text-sm font-bold tabular-nums leading-none tracking-tight", hasMoreRadioLines && "text-amber-500")}>
                      {radioLineCount.toLocaleString(i18n.language)}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground leading-none uppercase tracking-wider">
                      {t("overlay.radiolinesCount", { count: radioLineCount })}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t("overlay.moreRadiolines", {
                    total: radioLineTotalCount,
                    shown: radioLineCount,
                  })}
                </TooltipContent>
              </Tooltip>
            )}
            <div className="bg-muted/30 px-2 py-1.5 flex items-center gap-1.5">
              <span className="text-[8px] uppercase font-bold text-primary/80 leading-none whitespace-nowrap">
                {filters.source === "uke" ? t("stationDetails:tabs.permits") : t("filters.internalDb")}
              </span>
              <div className="w-px h-2 bg-border/60" />
              <span className="text-[8px] uppercase font-bold text-blue-600/80 dark:text-blue-400/80 leading-none whitespace-nowrap">
                {t("overlay.zoom")} {zoom?.toFixed(1) || "-"}
              </span>
            </div>
          </div>

          <MapCursorInfo activeMarker={activeMarker} />
        </div>

        <div className="relative">
          <MapStyleSwitcher />
        </div>
      </div>

      <div className="md:hidden absolute bottom-4 left-4 z-5 flex flex-col items-start gap-1">
        <div className="relative">
          <MapStyleSwitcher position="mobile" />
        </div>

        <div className="bg-background/95 backdrop-blur-md border rounded-lg shadow-lg overflow-hidden">
          <Tooltip>
            <TooltipTrigger
              className={cn("px-2 py-1.5 bg-muted/30 flex items-center gap-2", hasMoreLocations && "cursor-help")}
              disabled={!hasMoreLocations}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  {filters.showStations && (
                    <>
                      {isLoading || isFetching ? (
                        <Spinner className="size-3 text-primary" />
                      ) : hasMoreLocations ? (
                        <div className="size-1.5 rounded-full shrink-0 bg-amber-500 animate-pulse" />
                      ) : (
                        <div className={cn("size-1.5 rounded-full shrink-0", searchMode === "search" ? "bg-primary" : "bg-emerald-500")} />
                      )}
                      <span className={cn("text-xs font-bold leading-none", hasMoreLocations && "text-amber-500")}>
                        {locationCount.toLocaleString(i18n.language)}
                      </span>
                      <span className="text-[8px] font-bold text-muted-foreground leading-none uppercase tracking-wider">
                        {t("overlay.locations")}
                      </span>
                    </>
                  )}
                  {(radioLineCount > 0 || isRadioLinesFetching) && (
                    <>
                      {filters.showStations && <span className="text-[8px] text-muted-foreground leading-none">·</span>}
                      {isRadioLinesFetching ? (
                        <Spinner className="size-2.5 text-primary" />
                      ) : hasMoreRadioLines ? (
                        <div className="size-1.5 rounded-full shrink-0 bg-amber-500 animate-pulse" />
                      ) : null}
                      <span className={cn("text-xs font-bold leading-none", hasMoreRadioLines && "text-amber-500")}>
                        {radioLineCount.toLocaleString(i18n.language)}
                      </span>
                      <span className="text-[8px] font-bold text-muted-foreground leading-none uppercase tracking-wider">
                        {t("overlay.radiolinesCount", { count: radioLineCount })}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[7px] uppercase font-bold text-primary border-b border-primary/20 leading-none">
                    {filters.source === "uke" ? "UKE" : "INT"}
                  </span>
                  <span className="text-[7px] uppercase font-bold text-blue-600 dark:text-blue-400 border-b border-blue-500/20 leading-none">
                    Z{zoom?.toFixed(1) || "-"}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              {filters.showStations && <p>{t("overlay.moreStations", { total: totalCount, shown: locationCount })}</p>}
              {hasMoreRadioLines && (
                <p>
                  {t("overlay.moreRadiolines", {
                    total: radioLineTotalCount,
                    shown: radioLineCount,
                  })}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
});
