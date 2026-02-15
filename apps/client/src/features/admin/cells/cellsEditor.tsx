import { Fragment, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import type { Band } from "@/types/station";
import { RAT_ICONS, RAT_ORDER, ratToGenLabel } from "./rat";
import { getTableHeaders } from "./cellsTableHeaders";
import { CellEditRow } from "./cellEditRow";
import type { CellDraftBase } from "./cellEditRow";

export type DiffBadges = {
	added?: number;
	modified?: number;
	deleted?: number;
};

export type CellsEditorProps<T extends CellDraftBase> = {
	cellsByRat: Record<string, T[]>;
	enabledRats: string[];
	visibleRats: string[];
	bands: Band[];

	onToggleRat: (rat: string) => void;
	onCellChange: (localId: string, patch: Partial<CellDraftBase>) => void;
	onAddCell: (rat: string) => void;
	onDeleteCell: (localId: string) => void;

	// Disable all RAT toggle pills (e.g. when submission is rejected)
	ratPillsDisabled?: boolean;

	// Whether to show the "Add cell" button per RAT section. Default: true
	showAddButton?: boolean;

	// Compute diff badge counts for a RAT section header
	getDiffBadges?: (rat: string, cells: T[]) => DiffBadges;

	// Compute per-cell CellEditRow display props
	getCellProps?: (cell: T) => {
		disabled?: boolean;
		leftBorderClass?: string;
		showDelete?: boolean;
		rowClassName?: string;
	};

	// Render extra content after each cell row (e.g., "was" diff row for submissions)
	renderAfterRow?: (cell: T) => ReactNode;

	// Additional className for each RAT section card
	sectionClassName?: string;

	readOnly?: boolean;
};

export function CellsEditor<T extends CellDraftBase>({
	cellsByRat,
	enabledRats,
	visibleRats,
	bands,
	onToggleRat,
	onCellChange,
	onAddCell,
	onDeleteCell,
	ratPillsDisabled,
	showAddButton = true,
	getDiffBadges,
	getCellProps,
	renderAfterRow,
	sectionClassName,
	readOnly,
}: CellsEditorProps<T>) {
	const { t } = useTranslation(["stations"]);

	return (
		<>
			<div className="flex flex-wrap gap-1">
				{RAT_ORDER.map((rat) => {
					const isSelected = !ratPillsDisabled && enabledRats.includes(rat);
					return (
						<button
							key={rat}
							type="button"
							onClick={() => onToggleRat(rat)}
							disabled={ratPillsDisabled}
							className={cn(
								"flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all border",
								isSelected
									? "bg-primary text-primary-foreground border-primary shadow-sm"
									: "border-border bg-background hover:bg-muted text-foreground dark:bg-input/30 dark:border-input",
								ratPillsDisabled && "opacity-50 cursor-not-allowed",
							)}
						>
							<span className="text-xs opacity-70">{ratToGenLabel(rat)}</span>
							<span>{rat}</span>
						</button>
					);
				})}
			</div>

			{visibleRats.length === 0 ? (
				<div className="border rounded-xl h-full min-h-32 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
					{readOnly ? t("submissions:detail.readOnly") : t("stations:cells.noRats")}
				</div>
			) : (
				visibleRats.map((rat) => {
					const cellsForRat = cellsByRat[rat] ?? [];
					const headers = getTableHeaders(rat, t);
					const badges = getDiffBadges?.(rat, cellsForRat);
					const hasChanges = badges && ((badges.added ?? 0) > 0 || (badges.modified ?? 0) > 0 || (badges.deleted ?? 0) > 0);

					return (
						<Collapsible key={rat} defaultOpen>
							<div className={cn("border rounded-xl overflow-hidden", sectionClassName)}>
								<div className="px-4 py-2.5 bg-muted/50 border-b flex items-center justify-between">
									<CollapsibleTrigger className="flex items-center gap-2 cursor-pointer select-none group">
										<HugeiconsIcon
											icon={ArrowDown01Icon}
											className="size-3.5 text-muted-foreground transition-transform group-data-panel-open:rotate-0 -rotate-90"
										/>
										<HugeiconsIcon icon={RAT_ICONS[rat]} className="size-4 text-primary" />
										<span className="font-semibold text-sm">{rat}</span>
										<span className="text-xs text-muted-foreground">({t("stations:cells.cellsCount", { count: cellsForRat.length })})</span>
										{hasChanges && (
											<span className="flex items-center gap-2 ml-1">
												{(badges.added ?? 0) > 0 && (
													<span className="text-xs text-green-600 flex items-center gap-1">
														<span className="size-1.5 rounded-full bg-green-500" />
														{badges.added} {t("cells.diffAdded", { count: badges.added })}
													</span>
												)}
												{(badges.modified ?? 0) > 0 && (
													<span className="text-xs text-amber-600 flex items-center gap-1">
														<span className="size-1.5 rounded-full bg-amber-500" />
														{badges.modified} {t("cells.diffModified", { count: badges.modified })}
													</span>
												)}
												{(badges.deleted ?? 0) > 0 && (
													<span className="text-xs text-red-600 flex items-center gap-1">
														<span className="size-1.5 rounded-full bg-red-500" />
														{badges.deleted} {t("cells.diffDeleted", { count: badges.deleted })}
													</span>
												)}
											</span>
										)}
									</CollapsibleTrigger>
									{showAddButton && (
										<Button type="button" variant="ghost" size="sm" onClick={() => onAddCell(rat)} className="h-7 text-xs">
											<HugeiconsIcon icon={Add01Icon} className="size-3.5" />
											{t("stations:cells.addCell")}
										</Button>
									)}
								</div>
								<CollapsibleContent>
									{cellsForRat.length === 0 ? (
										<div className="px-3 py-4 text-center text-sm text-muted-foreground">{t("stations:cells.noCells")}</div>
									) : (
										<div className="overflow-x-auto custom-scrollbar">
											<table className="w-full text-sm">
												<thead>
													<tr className="border-b bg-muted/30">
														{headers.map((h) => (
															<th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground text-xs">
																{h}
															</th>
														))}
													</tr>
												</thead>
												<tbody>
													{cellsForRat.map((cell) => {
														const cellProps = getCellProps?.(cell) ?? {};
														return (
															<Fragment key={cell._localId}>
																<CellEditRow
																	localCell={cell}
																	bands={bands}
																	disabled={cellProps.disabled}
																	leftBorderClass={cellProps.leftBorderClass}
																	showDelete={cellProps.showDelete}
																	rowClassName={cellProps.rowClassName}
																	onChange={onCellChange}
																	onDelete={onDeleteCell}
																/>
																{renderAfterRow?.(cell)}
															</Fragment>
														);
													})}
												</tbody>
											</table>
										</div>
									)}
								</CollapsibleContent>
							</div>
						</Collapsible>
					);
				})
			)}
		</>
	);
}
