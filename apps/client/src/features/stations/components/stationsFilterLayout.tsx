import { useCallback, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { StationsDataTable } from "@/features/stations/components/stationsDataTable";
import { ResponsiveFilters } from "@/features/stations/components/responsiveFilters";
import type { useStationsData } from "@/features/stations/hooks/useStationsData";
import type { Station, StationSortBy } from "@/types/station";

interface StationsListLayoutProps {
  data: ReturnType<typeof useStationsData>;
  onRowClick: (station: Station) => void;
  headerActions?: ReactNode;
  children?: ReactNode;
}

function subscribeToHeaderActions(callback: () => void) {
  const id = requestAnimationFrame(callback);
  return () => cancelAnimationFrame(id);
}

export function StationsListLayout({ data, onRowClick, headerActions, children }: StationsListLayoutProps) {
  const { t } = useTranslation("stations");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const headerActionsEl = useSyncExternalStore(
    subscribeToHeaderActions,
    () => document.getElementById("header-actions"),
    () => null,
  );

  const {
    stations,
    operators,
    regions,
    uniqueBandValues,
    totalStations,
    filters,
    setFilters,
    selectedRegions,
    setSelectedRegions,
    activeFilterCount,
    sort,
    setSort,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    isLoading,
    isFetching,
    hasMore,
    loadMore,
  } = data;

  const handleSort = useCallback(
    (column: StationSortBy) => {
      if (sortBy === column) {
        setSort((prev) => (prev === "desc" ? "asc" : "desc"));
      } else {
        setSortBy(column);
        setSort("desc");
      }
    },
    [sortBy, setSort, setSortBy],
  );

  return (
    <>
      <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
        <ResponsiveFilters
          isOpen={mobileFiltersOpen}
          onOpenChange={setMobileFiltersOpen}
          filters={filters}
          operators={operators}
          regions={regions}
          uniqueBandValues={uniqueBandValues}
          selectedRegions={selectedRegions}
          searchQuery={searchQuery}
          onFiltersChange={setFilters}
          onRegionsChange={setSelectedRegions}
          onSearchQueryChange={setSearchQuery}
          stationCount={stations.length}
          totalStations={totalStations}
        />

        <div className="flex-1 flex flex-col p-3 min-h-0 overflow-hidden">
          <StationsDataTable
            data={stations}
            isLoading={isLoading}
            isFetchingMore={isFetching && !isLoading}
            onRowClick={onRowClick}
            onLoadMore={loadMore}
            hasMore={hasMore}
            totalItems={totalStations ?? stations.length}
            isSearchActive={!!searchQuery}
            sort={sort}
            sortBy={sortBy}
            onSort={handleSort}
          />
        </div>
      </div>

      {headerActionsEl &&
        createPortal(
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="relative md:hidden" onClick={() => setMobileFiltersOpen(true)}>
              <HugeiconsIcon icon={FilterIcon} className="size-4 mr-2" />
              {t("common:labels.filters")}
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {headerActions}
          </div>,
          headerActionsEl,
        )}

      {children}
    </>
  );
}
