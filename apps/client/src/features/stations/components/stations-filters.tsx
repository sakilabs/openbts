import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search02Icon, Cancel01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { cn, toggleValue } from "@/lib/utils";
import { Checkbox as UICheckbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
	Combobox,
	ComboboxChips,
	ComboboxChip,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { getOperatorColor } from "@/lib/operator-utils";
import { useSearchState } from "@/features/map/hooks/use-search-state";
import { AutocompleteDropdown } from "@/features/map/components/search-overlay/autocomplete-dropdown";
import { FILTER_KEYWORDS } from "@/features/map/constants";
import { parseFilters } from "@/features/map/filters";
import type { Operator, Region, StationFilters } from "@/types/station";
import i18n from "@/i18n/config";

const TOP4_MNCS = [26001, 26002, 26003, 26006]; // Plus, T-Mobile, Orange, Play

const RAT_OPTIONS = [
	{ value: "gsm", label: "GSM", gen: "2G" },
	{ value: "umts", label: "UMTS", gen: "3G" },
	{ value: "lte", label: "LTE", gen: "4G" },
	{ value: "5g", label: "NR", gen: "5G" },
	{ value: "iot", label: "IoT", gen: "NB" },
] as const;

type StationsFiltersProps = {
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
	isSheet?: boolean;
};

export function StationsFilters({
	filters,
	operators,
	regions,
	uniqueBandValues,
	selectedRegions,
	searchQuery: parentSearchQuery,
	onFiltersChange,
	onRegionsChange,
	onSearchQueryChange,
	stationCount,
	totalStations,
	isSheet = false,
}: StationsFiltersProps) {
	const { t } = useTranslation("stations");
	const { t: tCommon } = useTranslation("common");
	const activeFilterCount = filters.operators.length + filters.bands.length + filters.rat.length + selectedRegions.length;

	const [showOtherOperators, setShowOtherOperators] = useState(false);

	const topOperators = useMemo(() => operators.filter((op) => TOP4_MNCS.includes(op.mnc)), [operators]);
	const otherOperators = useMemo(() => operators.filter((op) => !TOP4_MNCS.includes(op.mnc)), [operators]);
	const hasSelectedOther = otherOperators.some((op) => filters.operators.includes(op.mnc));

	const stationsFilterKeywords = useMemo(() => FILTER_KEYWORDS.filter((kw) => kw.availableOn.includes("stations")), []);

	const {
		query,
		inputValue,
		parsedFilters,
		autocompleteOptions,
		activeOverlay,
		isFocused,
		containerRef,
		inputRef,
		handleContainerBlur,
		handleInputChange,
		handleInputFocus,
		handleInputClick,
		applyAutocomplete,
		clearSearch,
		removeFilter,
	} = useSearchState({ filterKeywords: stationsFilterKeywords, parseFilters });

	const searchDebounceRef = useRef<number | null>(null);

	useEffect(() => {
		if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
		searchDebounceRef.current = setTimeout(() => {
			onSearchQueryChange(query);
		}, 500);
		return () => {
			if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
		};
	}, [query, onSearchQueryChange]);

	const handleClearSearch = () => {
		clearSearch();
		onSearchQueryChange("");
	};

	const handleToggleOperator = (mnc: number) => {
		onFiltersChange({ ...filters, operators: toggleValue(filters.operators, mnc) });
	};

	const handleToggleRat = (rat: string) => {
		onFiltersChange({ ...filters, rat: toggleValue(filters.rat, rat) });
	};

	const handleBandsChange = (bands: number[]) => {
		onFiltersChange({ ...filters, bands });
	};

	const handleClearFilters = () => {
		onFiltersChange({ operators: [], bands: [], rat: [], source: "internal", recentOnly: false });
		onRegionsChange([]);
	};

	const regionChipsRef = useRef<HTMLDivElement>(null);
	const bandChipsRef = useRef<HTMLDivElement>(null);

	return (
		<aside className={cn("shrink-0 overflow-y-auto h-full", isSheet ? "w-full" : "w-72 border-r bg-muted/20")}>
			<div className="p-3 space-y-4">
				<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("filters.search")}</span>
				<search ref={containerRef} onBlur={handleContainerBlur} className="relative">
					<div className={cn("rounded-lg border bg-background transition-all", isFocused && "ring-2 ring-primary/20 border-primary/30")}>
						<div className="flex items-center gap-1 px-3 py-2">
							<HugeiconsIcon icon={Search02Icon} className="size-4 text-muted-foreground shrink-0" />
							<div className="flex items-center gap-1 flex-1 flex-wrap">
								{parsedFilters.map((filter, index) => (
									<div
										key={`${filter.key}-${index}`}
										className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium border border-primary/20 shrink-0"
									>
										<span className="font-mono text-[10px]">{filter.key}:</span>
										<span className="text-[10px] max-w-20 truncate" title={filter.value}>
											{filter.value}
										</span>
										<button onClick={() => removeFilter(filter)} className="hover:bg-primary/20 rounded p-0.5 transition-colors" type="button">
											<HugeiconsIcon icon={Cancel01Icon} className="size-2.5" />
										</button>
									</div>
								))}
								<input
									ref={inputRef}
									type="text"
									value={inputValue}
									onChange={handleInputChange}
									onFocus={handleInputFocus}
									onClick={handleInputClick}
									placeholder={parsedFilters.length > 0 ? "" : t("filters.searchPlaceholder")}
									className="flex-1 min-w-16 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
								/>
							</div>
							{(inputValue || parsedFilters.length > 0) && (
								<button type="button" onClick={handleClearSearch} className="p-0.5 hover:bg-muted rounded transition-colors shrink-0">
									<HugeiconsIcon icon={Cancel01Icon} className="size-4 text-muted-foreground" />
								</button>
							)}
						</div>
						{activeOverlay === "autocomplete" && autocompleteOptions.length > 0 && (
							<div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-background shadow-lg">
								<AutocompleteDropdown options={autocompleteOptions} onSelect={applyAutocomplete} />
							</div>
						)}
					</div>
				</search>

				<Separator />

				{!isSheet && (
					<div className="flex items-center justify-between">
						<h2 className="font-semibold text-sm">{t("filters.title")}</h2>
						{activeFilterCount > 0 && (
							<button type="button" onClick={handleClearFilters} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
								{tCommon("actions.clearAll")}
							</button>
						)}
					</div>
				)}
				{isSheet && activeFilterCount > 0 && (
					<button type="button" onClick={handleClearFilters} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
						{tCommon("actions.clearAll")}
					</button>
				)}

				<div>
					<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("filters.network")}</span>
					<div className="space-y-0.5">
						{topOperators.map((op) => (
							<label
								htmlFor={`operator-${op.mnc}`}
								key={op.mnc}
								className={cn(
									"flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors",
									filters.operators.includes(op.mnc) ? "bg-primary/10" : "hover:bg-muted",
								)}
							>
								<UICheckbox
									id={`operator-${op.mnc}`}
									checked={filters.operators.includes(op.mnc)}
									onCheckedChange={() => handleToggleOperator(op.mnc)}
								/>
								<div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: getOperatorColor(op.mnc) }} />
								<span className="text-sm truncate">{op.name}</span>
							</label>
						))}
					</div>

					{otherOperators.length > 0 && (
						<div className="mt-1.5">
							<button
								type="button"
								onClick={() => setShowOtherOperators(!showOtherOperators)}
								className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-1"
							>
								<HugeiconsIcon icon={ArrowDown01Icon} className={cn("size-3.5 transition-transform", showOtherOperators && "rotate-180")} />
								<span>
									{t("filters.otherOperators", { count: otherOperators.length })}
									{hasSelectedOther && ` (${otherOperators.filter((op) => filters.operators.includes(op.mnc)).length} ${t("filters.selected")})`}
								</span>
							</button>

							{showOtherOperators && (
								<div className="space-y-0.5 mt-1.5 pt-1.5 border-t border-border/50">
									{otherOperators.map((op) => (
										<label
											htmlFor={`operator-${op.mnc}`}
											key={op.mnc}
											className={cn(
												"flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors",
												filters.operators.includes(op.mnc) ? "bg-primary/10" : "hover:bg-muted",
											)}
										>
											<UICheckbox
												id={`operator-${op.mnc}`}
												checked={filters.operators.includes(op.mnc)}
												onCheckedChange={() => handleToggleOperator(op.mnc)}
											/>
											<div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: getOperatorColor(op.mnc) }} />
											<span className="text-sm truncate">{op.name}</span>
										</label>
									))}
								</div>
							)}
						</div>
					)}
				</div>

				<div>
					<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("filters.region")}</span>
					<Combobox
						multiple
						value={selectedRegions.map((id) => regions.find((r) => r.id === id)).filter(Boolean) as Region[]}
						onValueChange={(values) => onRegionsChange(values.map((v) => v.id))}
						items={regions}
					>
						<ComboboxChips ref={regionChipsRef} className="min-h-8 max-h-16 overflow-y-auto text-sm">
							{selectedRegions.map((regionId) => {
								const region = regions.find((r) => r.id === regionId);
								return region ? <ComboboxChip key={regionId}>{region.name}</ComboboxChip> : null;
							})}
							<ComboboxChipsInput placeholder={selectedRegions.length === 0 ? t("filters.selectRegions") : ""} />
						</ComboboxChips>
						<ComboboxContent anchor={regionChipsRef}>
							<ComboboxList>
								<ComboboxEmpty>{t("filters.noRegionsFound")}</ComboboxEmpty>
								{regions.map((region) => (
									<ComboboxItem key={region.id} value={region}>
										{region.name}
									</ComboboxItem>
								))}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
				</div>

				<div>
					<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("filters.standard")}</span>
					<div className="grid grid-cols-2 gap-0.5">
						{RAT_OPTIONS.map((rat) => (
							<label
								htmlFor={`rat-${rat.value}`}
								key={rat.value}
								className={cn(
									"flex items-center gap-1.5 px-1.5 py-1 rounded cursor-pointer transition-colors",
									filters.rat.includes(rat.value) ? "bg-primary/10" : "hover:bg-muted",
								)}
							>
								<UICheckbox id={`rat-${rat.value}`} checked={filters.rat.includes(rat.value)} onCheckedChange={() => handleToggleRat(rat.value)} />
								<span className="text-[10px] text-muted-foreground font-mono">{rat.gen}</span>
								<span className="text-xs">{rat.label}</span>
							</label>
						))}
					</div>
				</div>

				<div>
					<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("filters.band")}</span>
					<Combobox
						multiple
						value={filters.bands}
						onValueChange={handleBandsChange}
						items={uniqueBandValues}
						disabled={parentSearchQuery.trim().length > 0}
					>
						<ComboboxChips ref={bandChipsRef} className="min-h-8 max-h-16 overflow-y-auto text-sm">
							{filters.bands.map((band) => (
								<ComboboxChip key={band}>{band}</ComboboxChip>
							))}
							<ComboboxChipsInput placeholder={filters.bands.length === 0 ? t("filters.selectBands") : ""} />
						</ComboboxChips>
						<ComboboxContent anchor={bandChipsRef}>
							<ComboboxList>
								<ComboboxEmpty>{t("filters.noBandsFound")}</ComboboxEmpty>
								{uniqueBandValues.map((band) => (
									<ComboboxItem key={band} value={band}>
										<span className="font-mono">{band} MHz</span>
									</ComboboxItem>
								))}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
				</div>

				<div className="text-xs text-muted-foreground pt-2 border-t">
					{totalStations !== undefined
						? t("filters.showingStationsOfTotal", { count: stationCount, total: totalStations.toLocaleString(i18n.language) })
						: t("filters.showingStations", { count: stationCount })}
				</div>
			</div>
		</aside>
	);
}
