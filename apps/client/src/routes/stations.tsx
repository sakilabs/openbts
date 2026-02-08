import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StationsFilters } from "@/features/stations/components/stations-filters";
import { StationsDataTable } from "@/features/stations/components/stations-data-table";
import { StationDetailsDialog } from "@/features/station-details/components/station-details-dialog";
import { useStationsData } from "@/features/stations/hooks/use-stations-data";
import type { StationSortBy } from "@/types/station";
import type { RouteHandle } from "./_layout";

export const handle: RouteHandle = {
	titleKey: "items.database",
	i18nNamespace: "nav",
	breadcrumbs: [{ titleKey: "sections.stations", i18nNamespace: "nav", path: "/" }],
};

export default function StationsListPage() {
	const { t } = useTranslation("stations");
	const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
	const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
	const [headerActionsEl, setHeaderActionsEl] = useState<HTMLElement | null>(null);

	useEffect(() => {
		setHeaderActionsEl(document.getElementById("header-actions"));
	}, []);

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
	} = useStationsData();

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
				<div className="hidden md:block shrink-0">
					<StationsFilters
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
				</div>

				<Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
					<SheetContent side="left" className="w-72 p-0">
						<SheetHeader className="border-b px-4 py-3">
							<SheetTitle>{t("filters.title")}</SheetTitle>
						</SheetHeader>
						<div className="flex-1 overflow-y-auto">
							<StationsFilters
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
								isSheet
							/>
						</div>
					</SheetContent>
				</Sheet>

				<div className="flex-1 flex flex-col p-3 min-h-0 overflow-hidden">
					<StationsDataTable
						data={stations}
						isLoading={isLoading}
						isFetchingMore={isFetching && !isLoading}
						onRowClick={(station) => setSelectedStationId(station.id)}
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
					<Button variant="outline" size="sm" className="relative md:hidden" onClick={() => setMobileFiltersOpen(true)}>
						<HugeiconsIcon icon={FilterIcon} className="size-4 mr-2" />
						{t("filters.title")}
						{activeFilterCount > 0 && (
							<span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
								{activeFilterCount}
							</span>
						)}
					</Button>,
					headerActionsEl,
				)}

			<StationDetailsDialog key={selectedStationId} stationId={selectedStationId} source="internal" onClose={() => setSelectedStationId(null)} />
		</>
	);
}
