import { useCallback, useMemo } from "react";
import type { StationFilters } from "@/types/station.js";
import { toggleValue } from "@/lib/utils.js";
import { RAT_OPTIONS, UKE_RAT_OPTIONS } from "../constants.js";

type UseFilterHandlersArgs = {
  filters: StationFilters;
  uniqueBandValues: number[];
  onFiltersChange: (filters: StationFilters) => void;
};

export function useFilterHandlers({ filters, uniqueBandValues, onFiltersChange }: UseFilterHandlersArgs) {
  const handleToggleOperator = useCallback(
    (mnc: number) => {
      onFiltersChange({ ...filters, operators: toggleValue(filters.operators, mnc) });
    },
    [filters, onFiltersChange],
  );

  const handleToggleBand = useCallback(
    (value: number) => {
      onFiltersChange({ ...filters, bands: toggleValue(filters.bands, value) });
    },
    [filters, onFiltersChange],
  );

  const handleToggleRat = useCallback(
    (rat: string) => {
      onFiltersChange({ ...filters, rat: toggleValue(filters.rat, rat) });
    },
    [filters, onFiltersChange],
  );

  const handleSelectAllRats = useCallback(() => {
    const ratOptions = filters.source === "uke" ? UKE_RAT_OPTIONS : RAT_OPTIONS;
    const allRats = ratOptions.map((r) => r.value as string);
    onFiltersChange({ ...filters, rat: allRats });
  }, [filters, onFiltersChange]);

  const handleClearAllRats = useCallback(() => {
    onFiltersChange({ ...filters, rat: [] });
  }, [filters, onFiltersChange]);

  const handleSelectAllBands = useCallback(() => {
    onFiltersChange({ ...filters, bands: uniqueBandValues });
  }, [filters, onFiltersChange, uniqueBandValues]);

  const handleClearAllBands = useCallback(() => {
    onFiltersChange({ ...filters, bands: [] });
  }, [filters, onFiltersChange]);

  const handleRecentDaysChange = useCallback(
    (days: number | null) => {
      onFiltersChange({ ...filters, recentDays: days });
    },
    [filters, onFiltersChange],
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange({
      operators: [],
      bands: [],
      rat: [],
      source: filters.source,
      recentDays: null,
      showStations: filters.showStations,
      showRadiolines: filters.showRadiolines,
      radiolineOperators: [],
      showHeatmap: filters.showHeatmap,
    });
  }, [filters.source, filters.showStations, filters.showRadiolines, filters.showHeatmap, onFiltersChange]);

  const activeFilterCount = useMemo(() => {
    return (
      filters.operators.length +
      filters.bands.length +
      filters.rat.length +
      (filters.recentDays !== null ? 1 : 0) +
      (filters.showRadiolines ? (filters.radiolineOperators?.length ?? 0) : 0)
    );
  }, [filters]);

  return {
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
  };
}
