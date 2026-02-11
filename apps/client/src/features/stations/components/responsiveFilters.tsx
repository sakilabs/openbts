import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StationsFilters } from "@/features/stations/components/stationsFilters";
import type { Operator, Region, StationFilters } from "@/types/station";

interface ResponsiveFiltersProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	filters: StationFilters;
	operators: Operator[];
	regions: Region[];
	uniqueBandValues: number[];
	selectedRegions: number[];
	searchQuery: string;
	onFiltersChange: (filters: StationFilters) => void;
	onRegionsChange: (regionIds: number[]) => void;
	onSearchQueryChange: (query: string) => void;
	stationCount: number;
	totalStations?: number;
}

export function ResponsiveFilters({
	isOpen,
	onOpenChange,
	filters,
	operators,
	regions,
	uniqueBandValues,
	selectedRegions,
	searchQuery,
	onFiltersChange,
	onRegionsChange,
	onSearchQueryChange,
	stationCount,
	totalStations,
}: ResponsiveFiltersProps) {
	const { t } = useTranslation("stations");

	const filterProps = {
		filters,
		operators,
		regions,
		uniqueBandValues,
		selectedRegions,
		searchQuery,
		onFiltersChange,
		onRegionsChange,
		onSearchQueryChange,
		stationCount,
		totalStations,
	};

	return (
		<>
			<div className="hidden md:block shrink-0">
				<StationsFilters {...filterProps} />
			</div>

			<Sheet open={isOpen} onOpenChange={onOpenChange}>
				<SheetContent side="left" className="w-72 p-0">
					<SheetHeader className="border-b px-4 py-3">
						<SheetTitle>{t("filters.title")}</SheetTitle>
					</SheetHeader>
					<div className="flex-1 overflow-y-auto">
						<StationsFilters {...filterProps} isSheet />
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
