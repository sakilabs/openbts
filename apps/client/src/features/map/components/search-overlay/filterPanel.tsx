import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { Operator, StationFilters, StationSource } from "@/types/station";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Database02Icon,
	ArrowDown01Icon,
	File02Icon,
	InformationCircleIcon,
	FilterIcon,
	AirportTowerIcon,
	Route02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "./checkbox";
import { getOperatorColor, TOP4_MNCS } from "@/lib/operatorUtils";
import { RAT_OPTIONS, UKE_RAT_OPTIONS } from "../../constants";
import { fetchStats } from "../../statsApi";
import { fetchUkeRadioLineOperators } from "@/features/shared/api";
import type { UkeOperator } from "@/features/shared/api";
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

type FilterPanelProps = {
	filters: StationFilters;
	operators: Operator[];
	uniqueBandValues: number[];
	activeFilterCount: number;
	onFiltersChange: (filters: StationFilters) => void;
	onToggleOperator: (mnc: number) => void;
	onToggleBand: (value: number) => void;
	onToggleRat: (rat: string) => void;
	onToggleRecentOnly: () => void;
	onSelectAllRats: () => void;
	onClearAllRats: () => void;
	onSelectAllBands: () => void;
	onClearAllBands: () => void;
	onClearFilters: () => void;
	isSheet?: boolean;
};

export function FilterPanel({
	filters,
	operators,
	uniqueBandValues,
	activeFilterCount,
	onFiltersChange,
	onToggleOperator,
	onToggleBand,
	onToggleRat,
	onToggleRecentOnly,
	onSelectAllRats,
	onClearAllRats,
	onSelectAllBands,
	onClearAllBands,
	onClearFilters,
	isSheet = false,
}: FilterPanelProps) {
	const { t, i18n } = useTranslation(["main", "common"]);
	const [showOtherOperators, setShowOtherOperators] = useState(false);

	const { data: stats } = useQuery({
		queryKey: ["stats"],
		queryFn: fetchStats,
		staleTime: 1000 * 60 * 5,
	});

	const { data: radiolineOperatorsList = [] } = useQuery({
		queryKey: ["uke", "radiolines", "operators"],
		queryFn: fetchUkeRadioLineOperators,
		staleTime: 1000 * 60 * 30,
		enabled: filters.showRadiolines,
	});

	const radiolineOperatorsChipsRef = useRef<HTMLDivElement>(null);

	const topOperators = useMemo(() => operators.filter((op) => TOP4_MNCS.includes(op.mnc)), [operators]);
	const otherOperators = useMemo(() => operators.filter((op) => !TOP4_MNCS.includes(op.mnc)), [operators]);
	const hasSelectedOther = useMemo(() => otherOperators.some((op) => filters.operators.includes(op.mnc)), [otherOperators, filters.operators]);

	const dataSources = [
		{ id: "internal", label: t("filters.internalDb"), icon: Database02Icon },
		{ id: "uke", label: t("stationDetails:tabs.permits"), icon: File02Icon },
	];

	const handleToggleStations = useCallback(() => {
		if (!filters.showRadiolines && filters.showStations) return;
		onFiltersChange({ ...filters, showStations: !filters.showStations });
	}, [filters, onFiltersChange]);

	const handleToggleRadiolines = useCallback(() => {
		if (!filters.showStations && filters.showRadiolines) return;
		onFiltersChange({ ...filters, showRadiolines: !filters.showRadiolines });
	}, [filters, onFiltersChange]);

	const filterSections = (
		<div className={cn("space-y-2", isSheet ? "p-4" : "p-4 overflow-y-auto overscroll-contain")}>
			<div>
				<h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">{t("filters.layers")}</h4>
				<div className="grid grid-cols-2 gap-1">
					<Checkbox checked={filters.showStations} onChange={handleToggleStations}>
						<HugeiconsIcon icon={AirportTowerIcon} className="size-3.5 shrink-0" />
						<span className="flex-1 text-left">{t("filters.showStations")}</span>
					</Checkbox>
					<Checkbox checked={filters.showRadiolines} onChange={handleToggleRadiolines}>
						<HugeiconsIcon icon={Route02Icon} className="size-3.5 shrink-0" />
						<span className="flex-1 text-left">{t("filters.showRadiolines")}</span>
					</Checkbox>
				</div>
			</div>

			<div>
				<h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">{t("filters.dataSource")}</h4>
				<ButtonGroup className="w-full">
					{dataSources.map((src) => (
						<Button
							key={src.id}
							variant={filters.source === src.id ? "default" : "outline"}
							className="flex-1"
							onClick={() => {
								const newSource = src.id as StationSource;
								const targetRatValues = (newSource === "uke" ? UKE_RAT_OPTIONS : RAT_OPTIONS).map((r) => r.value as string);
								onFiltersChange({
									...filters,
									source: newSource,
									rat: filters.rat.filter((r) => targetRatValues.includes(r)),
								});
							}}
						>
							<HugeiconsIcon icon={src.icon} className="size-4" />
							<span>{src.label}</span>
						</Button>
					))}
				</ButtonGroup>
			</div>

			<div>
				<Checkbox checked={filters.recentOnly} onChange={onToggleRecentOnly}>
					<span className="flex-1 text-left">{t("filters.newOnly")}</span>
				</Checkbox>
			</div>

			<div>
				<div className="flex items-center justify-between mb-1.5">
					<h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("common:labels.operator")}</h4>
				</div>
				<div className="grid grid-cols-2 gap-1">
					{topOperators.map((op) => (
						<Checkbox key={op.mnc} checked={filters.operators.includes(op.mnc)} onChange={() => onToggleOperator(op.mnc)}>
							<div className="size-3 rounded-full shrink-0" style={{ backgroundColor: getOperatorColor(op.mnc) }} />
							<span className="flex-1 text-left truncate">{op.name}</span>
						</Checkbox>
					))}
				</div>

				{otherOperators.length > 0 && (
					<div className="mt-1.5">
						<button
							type="button"
							onClick={() => setShowOtherOperators(!showOtherOperators)}
							className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-1.5 py-1 transition-colors w-full"
						>
							<HugeiconsIcon icon={ArrowDown01Icon} className={cn("size-3.5 transition-transform", showOtherOperators && "rotate-180")} />
							<span>
								{t("common:labels.otherOperators", { count: otherOperators.length })}
								{hasSelectedOther &&
									` (${t("common:labels.selected", { count: otherOperators.filter((op) => filters.operators.includes(op.mnc)).length })})`}
							</span>
						</button>

						{showOtherOperators && (
							<div className="grid grid-cols-2 gap-1 mt-1.5 pt-1.5 border-t border-border/50">
								{otherOperators.map((op) => (
									<Checkbox key={op.mnc} checked={filters.operators.includes(op.mnc)} onChange={() => onToggleOperator(op.mnc)}>
										<div className="size-3 rounded-full shrink-0" style={{ backgroundColor: getOperatorColor(op.mnc) }} />
										<span className="flex-1 text-left truncate">{op.name}</span>
									</Checkbox>
								))}
							</div>
						)}
					</div>
				)}
				{filters.showRadiolines && radiolineOperatorsList?.length > 0 && (
					<div className="space-y-2 mt-1 pt-1">
						<h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("filters.radiolineOperator")}</h4>
						<Combobox
							multiple
							value={
								(filters.radiolineOperators ?? []).map((id) => radiolineOperatorsList.find((op) => op.id === id)).filter(Boolean) as UkeOperator[]
							}
							onValueChange={(values) => onFiltersChange({ ...filters, radiolineOperators: values.map((v) => v.id) })}
							items={radiolineOperatorsList}
							itemToStringLabel={(op) => op.name}
							filter={(op, query, itemToString) => {
								if (!query.trim()) return true;
								const q = query.toLowerCase().trim();
								const label = (itemToString?.(op) ?? op.name).toLowerCase();
								const full = (op.full_name ?? "").toLowerCase();
								return label.includes(q) || full.includes(q);
							}}
						>
							<ComboboxChips
								ref={radiolineOperatorsChipsRef}
								className="min-h-8 max-h-24 overflow-y-auto overflow-x-hidden text-sm overscroll-contain custom-scrollbar"
							>
								{(filters.radiolineOperators ?? []).map((id) => {
									const op = radiolineOperatorsList.find((o) => o.id === id);
									if (!op) return null;
									const maxLen = 12;
									const label = op.name.length > maxLen ? `${op.name.slice(0, maxLen)} ....` : op.name;
									return (
										<ComboboxChip key={id} title={op.name}>
											{label}
										</ComboboxChip>
									);
								})}
								<ComboboxChipsInput
									className="text-sm"
									placeholder={(filters.radiolineOperators ?? []).length === 0 ? t("filters.searchRadiolineOperators") : ""}
								/>
							</ComboboxChips>
							<ComboboxContent anchor={radiolineOperatorsChipsRef}>
								<ComboboxEmpty>{t("common:placeholder.noOperatorsFound")}</ComboboxEmpty>
								<ComboboxList>
									{(op: UkeOperator) => (
										<ComboboxItem key={op.id} value={op}>
											<span>{op.name}</span>
											{op.full_name && op.full_name !== op.name && (
												<span className="text-muted-foreground text-xs ml-auto truncate max-w-48" title={op.full_name}>
													{op.full_name}
												</span>
											)}
										</ComboboxItem>
									)}
								</ComboboxList>
							</ComboboxContent>
						</Combobox>
					</div>
				)}
			</div>
			<div>
				<div className="flex items-center justify-between mb-1.5">
					<h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("common:labels.standard")}</h4>
					<div className="flex gap-1">
						<button type="button" onClick={onSelectAllRats} className="text-xs text-primary underline-offset-4 hover:underline">
							{t("common:status.all")}
						</button>
						<span className="text-muted-foreground">/</span>
						<button
							type="reset"
							onClick={onClearAllRats}
							className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
						>
							{t("common:labels.none")}
						</button>
					</div>
				</div>
				<div className="flex flex-wrap gap-1">
					{(filters.source === "uke" ? UKE_RAT_OPTIONS : RAT_OPTIONS).map((rat) => (
						<button
							type="button"
							key={rat.value}
							onClick={() => onToggleRat(rat.value)}
							className={cn(
								"flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all border",
								filters.rat.includes(rat.value)
									? "bg-primary text-primary-foreground border-primary shadow-sm"
									: "border-border bg-background hover:bg-muted text-foreground dark:bg-input/30 dark:border-input",
							)}
						>
							<span className="text-xs opacity-70">{rat.gen}</span>
							<span>{rat.label}</span>
						</button>
					))}
				</div>
			</div>

			<div>
				<div className="flex items-center justify-between mb-1.5">
					<h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("common:labels.band")} (MHz)</h4>
					<div className="flex gap-1">
						<button type="button" onClick={onSelectAllBands} className="text-xs text-primary underline-offset-4 hover:underline">
							{t("common:status.all")}
						</button>
						<span className="text-muted-foreground">/</span>
						<button
							type="reset"
							onClick={onClearAllBands}
							className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
						>
							{t("common:labels.none")}
						</button>
					</div>
				</div>
				<div className="flex flex-wrap gap-1">
					{uniqueBandValues.map((value) => (
						<button
							type="button"
							key={value}
							onClick={() => onToggleBand(value)}
							className={cn(
								"px-2.5 py-0.5 rounded-full text-xs font-mono transition-all border",
								filters.bands.includes(value)
									? "bg-primary text-primary-foreground border-primary shadow-sm"
									: "border-border bg-background hover:bg-muted text-foreground dark:bg-input/30 dark:border-input",
							)}
						>
							{value}
						</button>
					))}
				</div>
			</div>

			{activeFilterCount > 0 && (
				<div className="pt-2 border-t">
					<p className="text-xs text-muted-foreground">
						<span className="font-medium text-foreground">{t("common:labels.filtersActive", { count: activeFilterCount })}</span>
						{filters.operators.length > 0 && <> · {t("common:labels.operators", { count: filters.operators.length })}</>}
						{filters.showRadiolines && (filters.radiolineOperators?.length ?? 0) > 0 && (
							<> · {t("filters.radiolineOperators", { count: filters.radiolineOperators?.length ?? 0 })}</>
						)}
						{filters.rat.length > 0 && <> · {t("common:labels.standard", { count: filters.rat.length })}</>}
						{filters.bands.length > 0 && <> · {t("common:labels.bands", { count: filters.bands.length })}</>}
					</p>
				</div>
			)}

			{stats && (
				<div className="pt-2 border-t">
					<div className="flex items-center gap-1.5 mb-1.5">
						<HugeiconsIcon icon={InformationCircleIcon} className="size-3.5 text-muted-foreground" />
						<h4 className="text-xs font-medium text-muted-foreground">{t("stats.dataInfo")}</h4>
					</div>
					<div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
						<div className="flex justify-between">
							<span className="text-muted-foreground">{t("stats.internalData")}:</span>
							<span className="font-medium tabular-nums">
								{stats.lastUpdated.stations
									? new Date(stats.lastUpdated.stations).toLocaleDateString(i18n.language, {
											year: "numeric",
											month: "numeric",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})
									: t("common:status.never")}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">{t("stationDetails:tabs.permits")}:</span>
							<span className="font-medium tabular-nums">
								{stats.lastUpdated.stations_permits
									? new Date(stats.lastUpdated.stations_permits).toLocaleDateString(i18n.language, {
											year: "numeric",
											month: "numeric",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})
									: t("common:status.never")}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">{t("stats.stations")}:</span>
							<span className="font-medium tabular-nums">{stats.counts.stations.toLocaleString(i18n.language)}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">{t("stats.permits")}:</span>
							<span className="font-medium tabular-nums">{stats.counts.uke_permits.toLocaleString(i18n.language)}</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);

	if (isSheet) return filterSections;

	return (
		<div className="mt-2 bg-background/95 backdrop-blur-md ring-1 ring-foreground/10 rounded-xl shadow-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 relative z-15 max-h-[calc(100vh-8rem)] flex flex-col">
			<div className="px-4 py-2.5 border-b bg-muted/30 flex items-center gap-2 shrink-0">
				<HugeiconsIcon icon={FilterIcon} className="size-4" />
				<h3 className="font-medium text-sm">{t("common:labels.filters")}</h3>
				{activeFilterCount > 0 && (
					<button
						type="button"
						onClick={onClearFilters}
						className="text-xs text-muted-foreground hover:text-foreground transition-colors text-right ml-auto"
					>
						{t("common:actions.clearAll")}
					</button>
				)}
			</div>
			{filterSections}
		</div>
	);
}
