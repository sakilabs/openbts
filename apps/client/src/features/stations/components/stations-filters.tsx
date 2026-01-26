import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Checkbox as UICheckbox } from "@/components/ui/checkbox";
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
import type { Operator, Region, StationFilters } from "@/types/station";

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
	isSheet?: boolean;
};

function toggleValue<T>(values: T[], value: T): T[] {
	return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

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
	isSheet = false,
}: StationsFiltersProps) {
	const { t } = useTranslation("stations");
	const { t: tCommon } = useTranslation("common");
	const activeFilterCount = filters.operators.length + filters.bands.length + filters.rat.length + selectedRegions.length;

	const [localSearchQuery, setLocalSearchQuery] = useState(parentSearchQuery);
	const searchDebounceRef = useRef<number | null>(null);

	useEffect(() => {
		setLocalSearchQuery(parentSearchQuery);
	}, [parentSearchQuery]);

	const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setLocalSearchQuery(value);
		if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
		searchDebounceRef.current = setTimeout(() => {
			onSearchQueryChange(value);
		}, 800);
	};

	const handleClearSearchInput = () => {
		setLocalSearchQuery("");
		if (searchDebounceRef.current) {
			clearTimeout(searchDebounceRef.current);
		}
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
		onFiltersChange({ operators: [], bands: [], rat: [], source: "internal" });
		onRegionsChange([]);
	};

	const regionChipsRef = useRef<HTMLDivElement>(null);
	const bandChipsRef = useRef<HTMLDivElement>(null);

	return (
		<aside className={cn("shrink-0 overflow-y-auto h-full", isSheet ? "w-full" : "w-72 border-r bg-muted/20")}>
			<div className="p-3 space-y-4">
				<div>
					<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("filters.search")}</span>
					<div className="relative">
						<HugeiconsIcon icon={Search02Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<input
							type="text"
							value={localSearchQuery}
							onChange={handleSearchInputChange}
							placeholder={t("filters.searchPlaceholder")}
							className={cn(
								"w-full pl-9 pr-9 py-2 rounded-lg border bg-background text-sm outline-none transition-all",
								"placeholder:text-muted-foreground/60",
								"focus:ring-2 focus:ring-primary/20 focus:border-primary/30",
							)}
						/>
						{localSearchQuery && (
							<button
								type="button"
								onClick={handleClearSearchInput}
								className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded transition-colors"
							>
								<HugeiconsIcon icon={Cancel01Icon} className="size-4 text-muted-foreground" />
							</button>
						)}
					</div>
				</div>

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
						{operators.map((op) => (
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

				<div className="text-xs text-muted-foreground pt-2 border-t">{t("filters.showingStations", { count: stationCount })}</div>
			</div>
		</aside>
	);
}
