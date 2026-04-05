import { Fragment, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Add01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import type { Band } from "@/types/station";
import { RAT_ICONS, RAT_ORDER, ratToGenLabel } from "./rat";
import { getTableHeaders } from "./cellsTableHeaders";
import { CellEditRow } from "./cellEditRow";
import type { CellDraftBase } from "./cellEditRow";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";

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
  onCloneCell?: (localId: string) => void;
  clonedIds?: ReadonlySet<string>;
  onDeleteCell: (localId: string) => void;

  // Disable all RAT toggle pills (e.g. when submission is rejected)
  ratPillsDisabled?: boolean;

  // Whether to show the "Add cell" button per RAT section. Default: true
  showAddButton?: boolean;

  // Whether to show "Confirm cells" button per RAT (calls onConfirmAllCellsInRat for that RAT)
  showConfirmCellsButton?: boolean;
  onConfirmAllCellsInRat?: (rat: string) => void;

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

type RatTableProps<T extends CellDraftBase> = {
  cells: T[];
  headers: string[];
  bands: Band[];
  getCellProps?: CellsEditorProps<T>["getCellProps"];
  renderAfterRow?: CellsEditorProps<T>["renderAfterRow"];
  onCellChange: (localId: string, patch: Partial<CellDraftBase>) => void;
  onCloneCell?: (localId: string) => void;
  clonedIds?: ReadonlySet<string>;
  onDeleteCell: (localId: string) => void;
};

function RatTable<T extends CellDraftBase>({
  cells,
  headers,
  bands,
  getCellProps,
  renderAfterRow,
  onCellChange,
  onCloneCell,
  clonedIds,
  onDeleteCell,
}: RatTableProps<T>) {
  const scrollRef = useHorizontalScroll<HTMLDivElement>();
  return (
    <div ref={scrollRef} className="overflow-x-auto custom-scrollbar">
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
          {cells.map((cell) => {
            const cellProps = getCellProps?.(cell) ?? {};
            const isCloned = clonedIds?.has(cell._localId) ?? false;
            return (
              <Fragment key={cell._localId}>
                <CellEditRow
                  localCell={cell}
                  bands={bands}
                  disabled={cellProps.disabled}
                  leftBorderClass={isCloned ? "border-l-2 border-l-sky-500" : cellProps.leftBorderClass}
                  showDelete={cellProps.showDelete}
                  rowClassName={isCloned ? "bg-sky-500/5" : cellProps.rowClassName}
                  onChange={onCellChange}
                  onClone={onCloneCell}
                  onDelete={onDeleteCell}
                />
                {renderAfterRow?.(cell)}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CellsEditor<T extends CellDraftBase>({
  cellsByRat,
  enabledRats,
  visibleRats,
  bands,
  onToggleRat,
  onCellChange,
  onAddCell,
  onCloneCell,
  clonedIds,
  onDeleteCell,
  ratPillsDisabled,
  showAddButton = true,
  showConfirmCellsButton,
  onConfirmAllCellsInRat,
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
              <span className={cn("text-xs", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>{ratToGenLabel(rat)}</span>
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
                    <HugeiconsIcon icon={RAT_ICONS[rat]} className="size-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">{rat}</span>
                    <span className="text-xs text-muted-foreground inline sm:hidden">({cellsForRat.length})</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">({t("cells.cellsCount", { count: cellsForRat.length })})</span>
                    {hasChanges && (
                      <span className="flex items-center gap-2 ml-1">
                        {(badges.added ?? 0) > 0 && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-green-500" />
                            {badges.added}
                            <span className="hidden sm:inline">{t("cells.diffAdded", { count: badges.added })}</span>
                          </span>
                        )}
                        {(badges.modified ?? 0) > 0 && (
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            {badges.modified}
                            <span className="hidden sm:inline">{t("cells.diffModified", { count: badges.modified })}</span>
                          </span>
                        )}
                        {(badges.deleted ?? 0) > 0 && (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            {badges.deleted}
                            <span className="hidden sm:inline">{t("cells.diffDeleted", { count: badges.deleted })}</span>
                          </span>
                        )}
                      </span>
                    )}
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-1">
                    {showConfirmCellsButton && onConfirmAllCellsInRat && cellsForRat.length > 0 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => onConfirmAllCellsInRat(rat)} className="h-7 text-xs">
                        <HugeiconsIcon icon={Tick02Icon} className="size-3.5 sm:hidden" />
                        <span className="hidden sm:inline">{t("stations:cells.confirmCells")}</span>
                      </Button>
                    )}
                    {showAddButton && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => onAddCell(rat)} className="h-7 text-xs">
                        <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
                        <span className="hidden sm:inline">{t("stations:cells.addCell")}</span>
                      </Button>
                    )}
                  </div>
                </div>
                <CollapsibleContent>
                  {cellsForRat.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">{t("stations:cells.noCells")}</div>
                  ) : (
                    <RatTable
                      cells={cellsForRat}
                      headers={headers}
                      bands={bands}
                      getCellProps={getCellProps}
                      renderAfterRow={renderAfterRow}
                      onCellChange={onCellChange}
                      onCloneCell={onCloneCell}
                      clonedIds={clonedIds}
                      onDeleteCell={onDeleteCell}
                    />
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
