import { useCallback, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { UnassignedPermitsDataTable } from "@/features/admin/uke-permits/components/dataTable";
import { UnassignedPermitsResponsiveFilters } from "@/features/admin/uke-permits/components/responsiveFilters";
import { UkePermitDetailsDialog } from "@/features/station-details/components/ukePermitDetailsDialog";
import { useUnassignedPermitsData } from "@/features/admin/uke-permits/hooks/useUnassignedPermitsData";
import { useTablePagination } from "@/hooks/useTablePageSize";
import type { UkeStation } from "@/types/station";

function subscribeToHeaderActions(callback: () => void) {
  const id = requestAnimationFrame(callback);
  return () => cancelAnimationFrame(id);
}

function AdminUkePermitsPage() {
  const { t } = useTranslation("admin");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<UkeStation | null>(null);
  const headerActionsEl = useSyncExternalStore(
    subscribeToHeaderActions,
    () => document.getElementById("header-actions"),
    () => null,
  );

  const { containerRef, pagination, setPagination } = useTablePagination({
    rowHeight: 64,
    headerHeight: 40,
    paginationHeight: 45,
  });

  const data = useUnassignedPermitsData({ pagination, setPagination });

  const {
    stations,
    operators,
    regions,
    totalStations,
    filters,
    setFilters,
    selectedRegions,
    setSelectedRegions,
    clearAllFilters,
    activeFilterCount,
    searchQuery,
    setSearchQuery,
    isLoading,
  } = data;

  const handleOpenDetails = useCallback((station: UkeStation) => setSelectedStation(station), []);

  const handleViewOnMap = useCallback((station: UkeStation) => {
    if (!station.location) return;
    const url = `${window.location.origin}/#map=16/${station.location.latitude}/${station.location.longitude}?source=uke&station=${station.station_id}`;
    window.open(url, "_blank");
  }, []);

  return (
    <>
      <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
        <UnassignedPermitsResponsiveFilters
          isOpen={mobileFiltersOpen}
          onOpenChange={setMobileFiltersOpen}
          filters={filters}
          operators={operators}
          regions={regions}
          selectedRegions={selectedRegions}
          searchQuery={searchQuery}
          onFiltersChange={setFilters}
          onRegionsChange={setSelectedRegions}
          onClearAllFilters={clearAllFilters}
          onSearchQueryChange={setSearchQuery}
          stationCount={stations.length}
          totalStations={totalStations}
        />

        <div className="flex-1 flex flex-col p-3 min-h-0 overflow-hidden">
          <UnassignedPermitsDataTable
            data={stations}
            isLoading={isLoading}
            onOpenDetails={handleOpenDetails}
            onViewOnMap={handleViewOnMap}
            totalItems={totalStations}
            containerRef={containerRef}
            pagination={pagination}
            setPagination={setPagination}
          />
        </div>
      </div>

      <UkePermitDetailsDialog station={selectedStation} onClose={() => setSelectedStation(null)} />

      {headerActionsEl &&
        createPortal(
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="relative md:hidden" onClick={() => setMobileFiltersOpen(true)}>
              <HugeiconsIcon icon={FilterIcon} className="size-4 mr-2" />
              {t("ukePermits.title")}
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>,
          headerActionsEl,
        )}
    </>
  );
}

export const Route = createFileRoute("/_layout/admin/_layout/uke-permits")({
  component: AdminUkePermitsPage,
  staticData: {
    titleKey: "breadcrumbs.ukePermits",
    i18nNamespace: "admin",
    breadcrumbs: [{ titleKey: "breadcrumbs.admin", i18nNamespace: "admin" }],
    allowedRoles: ["admin", "moderator", "editor"],
  },
});
