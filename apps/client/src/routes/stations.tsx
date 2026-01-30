import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterIcon } from "@hugeicons/core-free-icons";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StationsFilters } from "@/features/stations/components/stations-filters";
import { StationsDataTable } from "@/features/stations/components/stations-data-table";
import { StationDetailsDialog } from "@/features/station-details/components/station-details-dialog";
import { useStationsData } from "@/features/stations/hooks/use-stations-data";

export default function StationsListPage() {
	const { t } = useTranslation("stations");
	const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
	const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
		searchQuery,
		setSearchQuery,
		isLoading,
		isFetching,
		hasMore,
		loadMore,
	} = useStationsData();

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className="overflow-hidden max-h-svh">
				<header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />
						<Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem className="hidden md:block">
									<BreadcrumbLink href="#">OpenBTS</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator className="hidden md:block" />
								<BreadcrumbItem>
									<BreadcrumbPage>{t("breadcrumb")}</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>

						<Button variant="outline" size="sm" className="md:hidden relative" onClick={() => setMobileFiltersOpen(true)}>
							<HugeiconsIcon icon={FilterIcon} className="size-4 mr-2" />
							{t("filters.title")}
							{activeFilterCount > 0 && (
								<span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
									{activeFilterCount}
								</span>
							)}
						</Button>
					</div>
				</header>

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
						/>
					</div>
				</div>

				<StationDetailsDialog key={selectedStationId} stationId={selectedStationId} source="internal" onClose={() => setSelectedStationId(null)} />
			</SidebarInset>
		</SidebarProvider>
	);
}
