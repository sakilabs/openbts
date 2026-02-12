import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { LocationsDataTable } from "@/features/admin/locations/components/locationsDataTable";
import { LocationsResponsiveFilters } from "@/features/admin/locations/components/locationsResponsiveFilters";
import { useLocationsData } from "@/features/admin/locations/hooks/useLocationsData";
import type { LocationWithStations, LocationSortBy } from "@/types/station";
import type { RouteHandle } from "@/routes/_layout";

export const handle: RouteHandle = {
	titleKey: "breadcrumbs.locations",
	i18nNamespace: "admin",
	breadcrumbs: [{ titleKey: "breadcrumbs.admin", i18nNamespace: "admin" }],
};

export default function AdminLocationsPage() {
	const { t } = useTranslation("admin");
	const navigate = useNavigate();
	const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
	const [headerActionsEl, setHeaderActionsEl] = useState<HTMLElement | null>(null);

	useEffect(() => {
		setHeaderActionsEl(document.getElementById("header-actions"));
	}, []);

	const data = useLocationsData();

	const {
		locations,
		operators,
		regions,
		totalLocations,
		filters,
		setFilters,
		selectedRegions,
		setSelectedRegions,
		clearAllFilters,
		activeFilterCount,
		searchQuery,
		setSearchQuery,
		sort,
		sortBy,
		setSort,
		setSortBy,
		isLoading,
		isFetching,
		hasMore,
		loadMore,
	} = data;

	const handleSort = useCallback(
		(column: LocationSortBy) => {
			if (sortBy === column) {
				setSort((prev) => (prev === "asc" ? "desc" : "asc"));
			} else {
				setSortBy(column);
				setSort("desc");
			}
		},
		[sortBy, setSort, setSortBy],
	);

	const handleRowClick = useCallback((location: LocationWithStations) => navigate(`/admin/locations/${location.id}`), [navigate]);

	return (
		<>
			<div className="flex-1 flex flex-row min-h-0 overflow-hidden">
				<LocationsResponsiveFilters
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
					locationCount={locations.length}
					totalLocations={totalLocations}
				/>

				<div className="flex-1 flex flex-col p-3 min-h-0 overflow-hidden">
					<LocationsDataTable
						data={locations}
						isLoading={isLoading}
						isFetchingMore={isFetching && !isLoading}
						onRowClick={handleRowClick}
						onLoadMore={loadMore}
						hasMore={hasMore}
						totalItems={totalLocations ?? locations.length}
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
							{t("locations.title")}
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
