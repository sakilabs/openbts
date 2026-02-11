import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { Operator, StationFilters, StationSource } from "@/types/station";
import { HugeiconsIcon } from "@hugeicons/react";
import { Database02Icon, ArrowDown01Icon, File02Icon, InformationCircleIcon, FilterIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "./checkbox";
import { getOperatorColor } from "@/lib/operatorUtils";
import { RAT_OPTIONS, UKE_RAT_OPTIONS } from "../../constants";
import { fetchStats } from "../../statsApi";

const TOP4_MNCS = [26001, 26002, 26003, 26006]; // Plus, T-Mobile, Orange, Play

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
}: FilterPanelProps) {
	const { t, i18n } = useTranslation(["map", "common"]);
	const [showOtherOperators, setShowOtherOperators] = useState(false);

	const { data: stats } = useQuery({
		queryKey: ["stats"],
		queryFn: fetchStats,
		staleTime: 1000 * 60 * 5,
	});

	const topOperators = operators.filter((op) => TOP4_MNCS.includes(op.mnc));
	const otherOperators = operators.filter((op) => !TOP4_MNCS.includes(op.mnc));
	const hasSelectedOther = otherOperators.some((op) => filters.operators.includes(op.mnc));

	const dataSources = [
		{ id: "internal", label: t("filters.internalDb"), icon: Database02Icon },
		{ id: "uke", label: t("filters.ukePermits"), icon: File02Icon },
	];

	return (
		<div className="mt-2 bg-background/95 backdrop-blur-md ring-1 ring-foreground/10 rounded-xl shadow-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 relative z-15 max-h-[calc(100vh-8rem)] flex flex-col">
			<div className="px-4 py-2.5 border-b bg-muted/30 flex items-center gap-2 shrink-0">
				<HugeiconsIcon icon={FilterIcon} className="size-4" />
				<h3 className="font-medium text-sm">{t("filters.title")}</h3>
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

			<div className="p-4 space-y-2 overflow-y-auto overscroll-contain">
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
									{t("filters.otherOperators", { count: otherOperators.length })}
									{hasSelectedOther && ` (${otherOperators.filter((op) => filters.operators.includes(op.mnc)).length} ${t("filters.selected")})`}
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
				</div>

				<div>
					<div className="flex items-center justify-between mb-1.5">
						<h4 className="ttext-xs font-medium uppercase tracking-wider text-muted-foreground">{t("filters.standard")}</h4>
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
								{t("filters.none")}
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
						<h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("filters.band")}</h4>
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
								{t("filters.none")}
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
			</div>

			{activeFilterCount > 0 && (
				<div className="px-4 py-2.5 border-t bg-muted/50 shrink-0">
					<p className="text-xs text-muted-foreground">
						<span className="font-medium text-foreground">{t("filters.filtersActive", { count: activeFilterCount })}</span>
						{filters.operators.length > 0 && <> · {t("filters.operators", { count: filters.operators.length })}</>}
						{filters.rat.length > 0 && <> · {t("filters.techs", { count: filters.rat.length })}</>}
						{filters.bands.length > 0 && <> · {t("filters.bands", { count: filters.bands.length })}</>}
					</p>
				</div>
			)}

			{stats && (
				<div className="px-4 py-2.5 border-t bg-muted/50 shrink-0">
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
									: t("stats.never")}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">{t("stats.ukePermits")}:</span>
							<span className="font-medium tabular-nums">
								{stats.lastUpdated.stations_permits
									? new Date(stats.lastUpdated.stations_permits).toLocaleDateString(i18n.language, {
											year: "numeric",
											month: "numeric",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										})
									: t("stats.never")}
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
}
