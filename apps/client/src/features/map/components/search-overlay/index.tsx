import { useState, useRef, useMemo, memo, type FocusEvent, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils.js";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet.js";
import type { Station, StationFilters } from "@/types/station.js";
import { searchLocations, searchStations } from "../../searchApi.js";
import { operatorsQueryOptions, bandsQueryOptions } from "@/features/shared/queries.js";
import { AutocompleteDropdown } from "./autocompleteDropdown.js";
import { FilterPanel } from "./filterPanel.js";
import { SearchResults } from "./searchResults.js";
import { MapStyleSwitcher } from "./mapStyleSwitcher.js";
import { MapCursorInfo } from "../mapCursorInfo.js";
import { SearchInput } from "./searchInput.js";
import { FilterButton } from "./filterButton.js";
import { StationCounter } from "./stationCounter.js";
import { MobileStatsPanel } from "./mobileStatsPanel.js";
import { FILTER_KEYWORDS } from "../../constants.js";
import { parseFilters } from "../../filters.js";
import { useSearchState } from "../../hooks/useSearchState.js";
import { useFilterHandlers } from "../../hooks/useFilterHandlers.js";
import { useIsMobile } from "@/hooks/useMobile.js";

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
  onActiveMarkerClear?: () => void;
  onFiltersChange: (filters: StationFilters) => void;
  onLocationSelect?: (lat: number, lon: number) => void;
  onStationSelect?: (station: Station) => void;
  hideSource?: boolean;
  hideAPIFilters?: boolean;
  showHeatmap?: boolean;
  onToggleHeatmap?: () => void;
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
  onActiveMarkerClear,
  onFiltersChange,
  onLocationSelect,
  onStationSelect,
  hideSource = false,
  hideAPIFilters = false,
  showHeatmap = false,
  onToggleHeatmap,
}: MapSearchOverlayProps) {
  const { t } = useTranslation("main");
  const [showFilters, setShowFilters] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const filterPanelRef = useRef<HTMLFieldSetElement>(null);
  const isMobile = useIsMobile();

  const mapFilterKeywords = useMemo(() => FILTER_KEYWORDS.filter((kw) => kw.availableOn.includes("map")), []);

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

  const uniqueBandValues = useMemo(() => {
    const values = [...new Set(bands.map((b) => b.value))];
    return values.sort((a, b) => a - b);
  }, [bands]);

  const {
    handleToggleOperator,
    handleToggleBand,
    handleToggleRat,
    handleSelectAllRats,
    handleClearAllRats,
    handleSelectAllBands,
    handleClearAllBands,
    handleRecentDaysChange,
    handleClearFilters,
    activeFilterCount,
  } = useFilterHandlers({ filters, uniqueBandValues, onFiltersChange });

  const searchKeyword = parseFilters(debouncedQuery).remainingText;

  const shouldSearchLocations = searchKeyword.trim().length >= 3 && activeOverlay !== "autocomplete" && autocompleteOptions.length === 0;

  const { data: locationResults = [], isLoading: isLocationSearchLoading } = useQuery({
    queryKey: ["geocoding-search", searchKeyword],
    queryFn: () => searchLocations(searchKeyword),
    enabled: shouldSearchLocations,
    staleTime: 1000 * 60 * 60,
  });

  const { data: stationResults = [], isLoading: isStationSearchLoading } = useQuery({
    queryKey: ["station-search", debouncedQuery],
    queryFn: () => searchStations(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const isSearching = isLocationSearchLoading || isStationSearchLoading;
  const showAutocomplete = activeOverlay === "autocomplete" && autocompleteOptions.length > 0;
  const showResults = activeOverlay === "results" && (isSearching || locationResults.length > 0 || stationResults.length > 0);

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

  function handleMobileExpand() {
    setMobileExpanded(true);
  }

  function handleMobileCollapse() {
    setMobileExpanded(false);
  }

  function handleToggleFilters() {
    setShowFilters((prev) => !prev);
  }

  return (
    <>
      <div
        className={cn(
          "absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-105 z-10",
          (showFilters || showResults || showAutocomplete) && "z-20",
        )}
      >
        <SearchInput
          containerRef={containerRef}
          inputRef={inputRef}
          inputValue={inputValue}
          parsedFilters={parsedFilters}
          isSearching={isSearching}
          query={query}
          isFocused={isFocused}
          mobileExpanded={mobileExpanded}
          onInputChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onInputFocus={handleInputFocus}
          onInputClick={handleInputClick}
          onRemoveFilter={removeFilter}
          onClearSearch={clearSearch}
          onContainerBlur={handleContainerBlur}
          onMobileExpand={handleMobileExpand}
          onMobileCollapse={handleMobileCollapse}
          filterSlot={
            <>
              <div className="h-6 w-px bg-border shrink-0" />
              <FilterButton showFilters={showFilters} activeFilterCount={activeFilterCount} onClick={handleToggleFilters} />
            </>
          }
        />

        {showAutocomplete && <AutocompleteDropdown options={autocompleteOptions} onSelect={applyAutocomplete} />}

        {showResults && (
          <SearchResults
            show
            isLoading={isSearching}
            locationResults={locationResults}
            stationResults={stationResults}
            onLocationSelect={onLocationSelect}
            onStationSelect={onStationSelect}
            onClose={closeOverlay}
          />
        )}

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
              hideSource={hideSource}
              hideAPIFilters={hideAPIFilters}
              showHeatmap={showHeatmap}
              onToggleHeatmap={onToggleHeatmap}
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
                hideSource={hideSource}
                hideAPIFilters={hideAPIFilters}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <div className="hidden md:flex absolute top-4 left-4 z-10 flex-col items-start gap-1.5">
        <StationCounter
          locationCount={locationCount}
          totalCount={totalCount}
          radioLineCount={radioLineCount}
          radioLineTotalCount={radioLineTotalCount}
          isRadioLinesFetching={isRadioLinesFetching}
          isLoading={isLoading}
          isFetching={isFetching}
          showStations={filters.showStations}
          zoom={zoom}
          source={filters.source}
        />

        <MapCursorInfo activeMarker={activeMarker} onActiveMarkerClear={onActiveMarkerClear} />

        <div className="relative">
          <MapStyleSwitcher />
        </div>
      </div>

      <div className="md:hidden absolute bottom-4 left-4 z-5 flex flex-col items-start gap-1">
        <div className="relative">
          <MapStyleSwitcher position="mobile" />
        </div>

        <MobileStatsPanel
          locationCount={locationCount}
          totalCount={totalCount}
          radioLineCount={radioLineCount}
          radioLineTotalCount={radioLineTotalCount}
          isRadioLinesFetching={isRadioLinesFetching}
          isLoading={isLoading}
          isFetching={isFetching}
          showStations={filters.showStations}
          searchMode={searchMode as "bounds" | "search"}
          zoom={zoom}
          source={filters.source}
        />
      </div>
    </>
  );
});
