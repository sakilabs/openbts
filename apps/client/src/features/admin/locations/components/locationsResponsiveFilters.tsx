import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LocationsFilters } from "./locationsFilters";
import type { Operator, Region } from "@/types/station";
import type { LocationFilters } from "../hooks/useLocationsData";

interface LocationsResponsiveFiltersProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	filters: LocationFilters;
	operators: Operator[];
	regions: Region[];
	selectedRegions: number[];
	searchQuery: string;
	onFiltersChange: (filters: LocationFilters) => void;
	onRegionsChange: (regionIds: number[]) => void;
	onSearchQueryChange: (query: string) => void;
	locationCount: number;
	totalLocations?: number;
}

export function LocationsResponsiveFilters({
	isOpen,
	onOpenChange,
	filters,
	operators,
	regions,
	selectedRegions,
	searchQuery,
	onFiltersChange,
	onRegionsChange,
	onSearchQueryChange,
	locationCount,
	totalLocations,
}: LocationsResponsiveFiltersProps) {
	const { t } = useTranslation("admin");

	const filterProps = {
		filters,
		operators,
		regions,
		selectedRegions,
		searchQuery,
		onFiltersChange,
		onRegionsChange,
		onSearchQueryChange,
		locationCount,
		totalLocations,
	};

	return (
		<>
			<div className="hidden md:block shrink-0">
				<LocationsFilters {...filterProps} />
			</div>

			<Sheet open={isOpen} onOpenChange={onOpenChange}>
				<SheetContent side="left" className="w-72 p-0">
					<SheetHeader className="border-b px-4 py-3">
						<SheetTitle>{t("locations.title")}</SheetTitle>
					</SheetHeader>
					<div className="flex-1 overflow-y-auto">
						<LocationsFilters {...filterProps} isSheet />
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
