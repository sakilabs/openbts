"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon, SlidersHorizontalIcon, Loading03Icon } from "@hugeicons/core-free-icons";
import { cn, toggleValue } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { Station, StationFilters } from "@/types/station";
import { fetchBands, fetchOperators, searchLocations, searchStations } from "../../search-api";
import { AutocompleteDropdown } from "./autocomplete-dropdown";
import { FilterPanel } from "./filter-panel";
import { SearchResults } from "./search-results";
import { MapStyleSwitcher } from "./map-style-switcher";
import { FILTER_KEYWORDS, RAT_OPTIONS, UKE_RAT_OPTIONS } from "../../constants";
import { parseFilters } from "../../filters";
import { useSearchState } from "../../hooks/use-search-state";

type MapSearchOverlayProps = {
	locationCount: number;
	totalCount: number;
	isLoading: boolean;
	isFetching?: boolean;
	filters: StationFilters;
	zoom?: number;
	onFiltersChange: (filters: StationFilters) => void;
	onLocationSelect?: (lat: number, lon: number) => void;
	onStationSelect?: (station: Station) => void;
};

export function MapSearchOverlay({
	locationCount,
	totalCount,
	isLoading,
	isFetching = false,
	filters,
	zoom,
	onFiltersChange,
	onLocationSelect,
	onStationSelect,
}: MapSearchOverlayProps) {
	const { t } = useTranslation("map");
	const [showFilters, setShowFilters] = useState(false);
	const filterPanelRef = useRef<HTMLFieldSetElement>(null);

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

	const { data: operators = [] } = useQuery({
		queryKey: ["operators"],
		queryFn: fetchOperators,
		staleTime: 1000 * 60 * 30,
	});

	const { data: bands = [] } = useQuery({
		queryKey: ["bands"],
		queryFn: fetchBands,
		staleTime: 1000 * 60 * 30,
	});

	const searchKeyword = useMemo(() => parseFilters(debouncedQuery).remainingText, [debouncedQuery]);

	const shouldSearchOsm = searchKeyword.trim().length >= 3 && activeOverlay !== "autocomplete" && autocompleteOptions.length === 0;

	const { data: osmResults = [], isLoading: isOsmLoading } = useQuery({
		queryKey: ["osm-search", searchKeyword],
		queryFn: () => searchLocations(searchKeyword),
		enabled: shouldSearchOsm,
		staleTime: 1000 * 60 * 60,
	});

	const { data: stationResults = [], isLoading: isStationSearchLoading } = useQuery({
		queryKey: ["station-search", debouncedQuery],
		queryFn: () => searchStations(debouncedQuery),
		enabled: debouncedQuery.trim().length > 0,
		staleTime: 1000 * 60 * 5,
	});

	const isSearching = isOsmLoading || isStationSearchLoading;
	const activeFilterCount = filters.operators.length + filters.bands.length + filters.rat.length;
	const showAutocomplete = activeOverlay === "autocomplete" && autocompleteOptions.length > 0;
	const showResults = activeOverlay === "results" && (isSearching || osmResults.length > 0 || stationResults.length > 0);
	const hasMoreLocations = totalCount > locationCount;

	const uniqueBandValues = useMemo(() => {
		const values = [...new Set(bands.map((b) => b.value))];
		return values.sort((a, b) => a - b);
	}, [bands]);

	function handleFilterPanelBlur(e: React.FocusEvent) {
		const relatedTarget = e.relatedTarget as Node | null;
		const isInsidePanel = filterPanelRef.current?.contains(relatedTarget);
		const isToggleButton = (relatedTarget as Element)?.closest("[data-filter-toggle]");

		if (!isInsidePanel && !isToggleButton) {
			setShowFilters(false);
		}
	}

	function handleKeyDown(e: React.KeyboardEvent) {
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

	const handleToggleOperator = useCallback(
		(mnc: number) => onFiltersChange({ ...filters, operators: toggleValue(filters.operators, mnc) }),
		[filters, onFiltersChange],
	);

	const handleToggleBand = useCallback(
		(value: number) => onFiltersChange({ ...filters, bands: toggleValue(filters.bands, value) }),
		[filters, onFiltersChange],
	);

	const handleToggleRat = useCallback(
		(rat: string) => onFiltersChange({ ...filters, rat: toggleValue(filters.rat, rat) }),
		[filters, onFiltersChange],
	);

	const handleSelectAllRats = useCallback(
		() => onFiltersChange({ ...filters, rat: (filters.source === "uke" ? UKE_RAT_OPTIONS : RAT_OPTIONS).map((r) => r.value) }),
		[filters, onFiltersChange],
	);

	const handleClearAllRats = useCallback(() => onFiltersChange({ ...filters, rat: [] }), [filters, onFiltersChange]);

	const handleSelectAllBands = useCallback(
		() => onFiltersChange({ ...filters, bands: uniqueBandValues }),
		[filters, onFiltersChange, uniqueBandValues],
	);

	const handleClearAllBands = useCallback(() => onFiltersChange({ ...filters, bands: [] }), [filters, onFiltersChange]);

	const handleClearFilters = useCallback(
		() => onFiltersChange({ operators: [], bands: [], rat: [], source: filters.source }),
		[filters.source, onFiltersChange],
	);

	return (
		<>
			<div className={cn("absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-105 z-10", showFilters && "z-20")}>
				<search
					ref={containerRef}
					onBlur={handleContainerBlur}
					className={cn(
						"bg-background/95 backdrop-blur-md border rounded-2xl shadow-xl transition-all duration-200",
						isFocused && "ring-2 ring-primary/20 border-primary/30",
					)}
				>
					<div className="flex items-center gap-2 px-3 py-2">
						<HugeiconsIcon icon={Search01Icon} className="size-5 text-muted-foreground shrink-0" />

						<div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
							{parsedFilters.map((filter, index) => (
								<div
									key={`${filter.key}-${index}`}
									className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium border border-primary/20 shrink-0"
								>
									<span className="font-mono text-xs whitespace-nowrap">{filter.key}:</span>
									<span className="text-xs whitespace-nowrap max-w-30 truncate" title={filter.value}>
										{filter.value}
									</span>
									<button onClick={() => removeFilter(filter)} className="hover:bg-primary/20 rounded p-0.5 transition-colors ml-0.5" type="button">
										<HugeiconsIcon icon={Cancel01Icon} className="size-3" />
									</button>
								</div>
							))}

							<input
								ref={inputRef}
								type="text"
								value={inputValue}
								onChange={handleInputChange}
								onKeyDown={handleKeyDown}
								onFocus={handleInputFocus}
								onClick={handleInputClick}
								placeholder={parsedFilters.length > 0 ? t("search.placeholderAddMore") : t("search.placeholder")}
								className="flex-1 min-w-25 bg-transparent text-base md:text-sm outline-none placeholder:text-muted-foreground/60"
							/>
						</div>

						{isSearching && query.trim() !== "" && <HugeiconsIcon icon={Loading03Icon} className="size-4 text-primary animate-spin shrink-0" />}

						{(query || parsedFilters.length > 0) && !isSearching && (
							<button onClick={clearSearch} className="p-1.5 hover:bg-muted rounded-lg transition-colors shrink-0" type="button">
								<HugeiconsIcon icon={Cancel01Icon} className="size-4 text-muted-foreground" />
							</button>
						)}

						<div className="h-6 w-px bg-border shrink-0" />

						<button
							data-filter-toggle
							onClick={() => setShowFilters(!showFilters)}
							type="button"
							className={cn(
								"flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all font-medium text-sm shrink-0 whitespace-nowrap",
								showFilters || activeFilterCount > 0
									? "bg-primary text-primary-foreground shadow-sm"
									: "bg-muted hover:bg-muted/80 text-muted-foreground",
							)}
						>
							<HugeiconsIcon icon={SlidersHorizontalIcon} className="size-4" />
							<span className="hidden sm:inline">{t("filters.button")}</span>
							{activeFilterCount > 0 && (
								<span
									className={cn(
										"text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1.5",
										showFilters || activeFilterCount > 0 ? "bg-primary-foreground/20" : "bg-primary text-primary-foreground",
									)}
								>
									{activeFilterCount}
								</span>
							)}
						</button>
					</div>

					{showAutocomplete && <AutocompleteDropdown options={autocompleteOptions} onSelect={applyAutocomplete} />}

					{showResults && (
						<SearchResults
							show
							isLoading={isSearching}
							osmResults={osmResults}
							stationResults={stationResults}
							onLocationSelect={onLocationSelect}
							onStationSelect={onStationSelect}
							onClose={closeOverlay}
						/>
					)}
				</search>

				{showFilters && (
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
							onSelectAllRats={handleSelectAllRats}
							onClearAllRats={handleClearAllRats}
							onSelectAllBands={handleSelectAllBands}
							onClearAllBands={handleClearAllBands}
							onClearFilters={handleClearFilters}
						/>
					</fieldset>
				)}
			</div>

			<div className="hidden md:flex absolute top-4 left-4 z-10 flex-col items-start gap-1.5">
				<div className="flex items-stretch shadow-xl rounded-lg overflow-hidden border bg-background/95 backdrop-blur-md">
					<Tooltip>
						<TooltipTrigger
							className={cn("px-2 py-1.5 flex items-center gap-2 border-r border-border/50", hasMoreLocations && "cursor-help")}
							disabled={!hasMoreLocations}
						>
							{isLoading || isFetching ? (
								<HugeiconsIcon icon={Loading03Icon} className="size-3 animate-spin text-primary" />
							) : hasMoreLocations ? (
								<div className="size-1.5 rounded-full shrink-0 bg-amber-500 animate-pulse" />
							) : (
								<div className="size-1.5 rounded-full shrink-0 bg-emerald-500" />
							)}
							<div className="flex items-baseline gap-1">
								<span className={cn("text-sm font-bold tabular-nums leading-none tracking-tight", hasMoreLocations && "text-amber-500")}>
									{locationCount.toLocaleString()}
								</span>
								<span className="text-[9px] font-bold text-muted-foreground leading-none uppercase tracking-wider">{t("overlay.locations")}</span>
							</div>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							{t("overlay.moreStations", { total: totalCount.toLocaleString(), shown: locationCount.toLocaleString() })}
						</TooltipContent>
					</Tooltip>
					<div className="bg-muted/30 px-2 py-1.5 flex items-center gap-1.5">
						<span className="text-[8px] uppercase font-bold text-primary/80 leading-none whitespace-nowrap">
							{filters.source === "uke" ? t("filters.ukePermits") : t("filters.internalDb")}
						</span>
						<div className="w-px h-2 bg-border/60" />
						<span className="text-[8px] uppercase font-bold text-blue-600/80 dark:text-blue-400/80 leading-none whitespace-nowrap">
							{t("overlay.zoom")} {zoom?.toFixed(1) || "-"}
						</span>
					</div>
				</div>

				<div className="relative">
					<MapStyleSwitcher />
				</div>
			</div>

			<div className="md:hidden absolute bottom-4 left-4 z-5 flex flex-col items-start gap-1">
				<div className="relative">
					<MapStyleSwitcher position="mobile" />
				</div>

				<div className="bg-background/95 backdrop-blur-md border rounded-lg shadow-lg overflow-hidden">
					<Tooltip>
						<TooltipTrigger
							className={cn("px-2 py-1.5 bg-muted/30 flex items-center gap-2", hasMoreLocations && "cursor-help")}
							disabled={!hasMoreLocations}
						>
							{isLoading || isFetching ? (
								<HugeiconsIcon icon={Loading03Icon} className="size-3 animate-spin text-primary" />
							) : hasMoreLocations ? (
								<div className="size-1.5 rounded-full shrink-0 bg-amber-500 animate-pulse" />
							) : (
								<div className={cn("size-1.5 rounded-full shrink-0", searchMode === "search" ? "bg-primary" : "bg-emerald-500")} />
							)}
							<div className="flex flex-col gap-0.5">
								<div className="flex items-center gap-1">
									<span className={cn("text-xs font-bold leading-none", hasMoreLocations && "text-amber-500")}>{locationCount.toLocaleString()}</span>
									<span className="text-[8px] font-bold text-muted-foreground leading-none uppercase tracking-wider">{t("overlay.locations")}</span>
								</div>
								<div className="flex items-center gap-1">
									<span className="text-[7px] uppercase font-bold text-primary border-b border-primary/20 leading-none">
										{filters.source === "uke" ? "UKE" : "INT"}
									</span>
									<span className="text-[7px] uppercase font-bold text-blue-600 dark:text-blue-400 border-b border-blue-500/20 leading-none">
										Z{zoom?.toFixed(1) || "-"}
									</span>
								</div>
							</div>
						</TooltipTrigger>
						<TooltipContent side="top">
							{t("overlay.moreStations", { total: totalCount.toLocaleString(), shown: locationCount.toLocaleString() })}
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</>
	);
}
