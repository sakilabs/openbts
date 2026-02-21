import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UnassignedPermitsFilters } from "./filters";
import type { Operator, Region } from "@/types/station";
import type { UnassignedPermitsFilters as FiltersType } from "../hooks/useUnassignedPermitsData";

interface UnassignedPermitsResponsiveFiltersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FiltersType;
  operators: Operator[];
  regions: Region[];
  selectedRegions: number[];
  searchQuery: string;
  onFiltersChange: (filters: FiltersType) => void;
  onRegionsChange: (regionIds: number[]) => void;
  onClearAllFilters: () => void;
  onSearchQueryChange: (query: string) => void;
  stationCount: number;
  totalStations?: number;
}

export function UnassignedPermitsResponsiveFilters({
  isOpen,
  onOpenChange,
  filters,
  operators,
  regions,
  selectedRegions,
  searchQuery,
  onFiltersChange,
  onRegionsChange,
  onClearAllFilters,
  onSearchQueryChange,
  stationCount,
  totalStations,
}: UnassignedPermitsResponsiveFiltersProps) {
  const { t } = useTranslation("admin");

  const filterProps = {
    filters,
    operators,
    regions,
    selectedRegions,
    searchQuery,
    onFiltersChange,
    onRegionsChange,
    onClearAllFilters,
    onSearchQueryChange,
    stationCount,
    totalStations,
  };

  return (
    <>
      <div className="hidden md:block shrink-0">
        <UnassignedPermitsFilters {...filterProps} />
      </div>

      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle>{t("common:labels.filters")}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <UnassignedPermitsFilters {...filterProps} isSheet />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
