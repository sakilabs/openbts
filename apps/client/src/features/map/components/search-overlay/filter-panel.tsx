import { useTranslation } from "react-i18next";
import type { Operator, StationFilters, StationSource } from "@/types/station";
import { HugeiconsIcon } from "@hugeicons/react";
import { Database02Icon, File02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Checkbox } from "./checkbox";
import { getOperatorColor } from "@/lib/operator-utils";
import { RAT_OPTIONS } from "../../constants";

type FilterPanelProps = {
	filters: StationFilters;
	operators: Operator[];
	uniqueBandValues: number[];
	activeFilterCount: number;
	onFiltersChange: (filters: StationFilters) => void;
	onToggleOperator: (mnc: number) => void;
	onToggleBand: (value: number) => void;
	onToggleRat: (rat: string) => void;
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
	onSelectAllRats,
	onClearAllRats,
	onSelectAllBands,
	onClearAllBands,
	onClearFilters,
}: FilterPanelProps) {
	const { t } = useTranslation("map");

	const dataSources = [
		{ id: "internal", label: t("filters.internalDb"), icon: Database02Icon },
		// { id: "uke", label: t("filters.ukePermits"), icon: File02Icon },
	];

	return (
		<div className="mt-2 bg-background/95 backdrop-blur-md border rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 relative z-15">
			<div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
				<h3 className="font-semibold text-sm">{t("filters.title")}</h3>
				{activeFilterCount > 0 && (
					<button type="button" onClick={onClearFilters} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
						{t("filters.clearAll")}
					</button>
				)}
			</div>

			<div className="p-4 space-y-5">
				<div>
					<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t("filters.dataSource")}</h4>
					<div className="flex gap-2">
						{dataSources.map((src) => (
							<button
								type="button"
								key={src.id}
								onClick={() => onFiltersChange({ ...filters, source: src.id as StationSource })}
								className={cn(
									"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border",
									filters.source === src.id
										? "bg-primary text-primary-foreground border-primary shadow-sm"
										: "bg-muted/50 hover:bg-muted border-transparent text-foreground",
								)}
							>
								<HugeiconsIcon icon={src.icon} className="size-4" />
								<span>{src.label}</span>
							</button>
						))}
					</div>
				</div>

				<div>
					<div className="flex items-center justify-between mb-2">
						<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("filters.operator")}</h4>
					</div>
					<div className="grid grid-cols-2 gap-1">
						{operators.map((op) => (
							<Checkbox key={op.mnc} checked={filters.operators.includes(op.mnc)} onChange={() => onToggleOperator(op.mnc)}>
								<div className="size-3 rounded-full shrink-0" style={{ backgroundColor: getOperatorColor(op.mnc) }} />
								<span className="flex-1 text-left truncate">{op.name}</span>
							</Checkbox>
						))}
					</div>
				</div>

				<div>
					<div className="flex items-center justify-between mb-2">
						<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("filters.standard")}</h4>
						<div className="flex gap-1">
							<button type="button" onClick={onSelectAllRats} className="text-xs text-primary hover:underline">
								{t("filters.all")}
							</button>
							<span className="text-muted-foreground">/</span>
							<button type="reset" onClick={onClearAllRats} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
								{t("filters.none")}
							</button>
						</div>
					</div>
					<div className="flex flex-wrap gap-1">
						{RAT_OPTIONS.map((rat) => (
							<button
								type="button"
								key={rat.value}
								onClick={() => onToggleRat(rat.value)}
								className={cn(
									"flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border",
									filters.rat.includes(rat.value)
										? "bg-primary text-primary-foreground border-primary shadow-sm"
										: "bg-muted/50 hover:bg-muted border-transparent text-foreground",
								)}
							>
								<span className="text-xs opacity-70">{rat.gen}</span>
								<span>{rat.label}</span>
							</button>
						))}
					</div>
				</div>

				<div>
					<div className="flex items-center justify-between mb-2">
						<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("filters.band")}</h4>
						<div className="flex gap-1">
							<button type="button" onClick={onSelectAllBands} className="text-xs text-primary hover:underline">
								{t("filters.all")}
							</button>
							<span className="text-muted-foreground">/</span>
							<button type="reset" onClick={onClearAllBands} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
								{t("filters.none")}
							</button>
						</div>
					</div>
					<div className="flex flex-wrap gap-1.5">
						{uniqueBandValues.map((value) => (
							<button
								type="button"
								key={value}
								onClick={() => onToggleBand(value)}
								className={cn(
									"px-3 py-1.5 rounded-lg text-sm font-mono transition-all border",
									filters.bands.includes(value)
										? "bg-primary text-primary-foreground border-primary shadow-sm"
										: "bg-muted/50 hover:bg-muted border-transparent",
								)}
							>
								{value}
							</button>
						))}
					</div>
				</div>
			</div>

			{activeFilterCount > 0 && (
				<div className="px-4 py-3 border-t bg-muted/30">
					<p className="text-xs text-muted-foreground">
						<span className="font-medium text-foreground">{t("filters.filtersActive", { count: activeFilterCount })}</span>
						{filters.operators.length > 0 && <> · {t("filters.operators", { count: filters.operators.length })}</>}
						{filters.rat.length > 0 && <> · {t("filters.techs", { count: filters.rat.length })}</>}
						{filters.bands.length > 0 && <> · {t("filters.bands", { count: filters.bands.length })}</>}
					</p>
				</div>
			)}
		</div>
	);
}
