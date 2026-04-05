import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CellDetailsForm } from "./cellDetailsForm";
import type { ProposedCellForm, RatType } from "../types";
import type { CellError } from "../utils/validation";

export interface CellsSectionProps {
  selectedRats: RatType[];
  cells: ProposedCellForm[];
  originalCells: ProposedCellForm[];
  isNewStation: boolean;
  cellErrors?: Record<string, CellError>;
  onCellsChange: (rat: RatType, cells: ProposedCellForm[]) => void;
}

export function CellsSection({ selectedRats, cells, originalCells, isNewStation, cellErrors, onCellsChange }: CellsSectionProps) {
  const { t } = useTranslation(["submissions", "common"]);

  const cellsByRat = useMemo(() => {
    const map = new Map<RatType, ProposedCellForm[]>();
    for (const cell of cells) {
      const list = map.get(cell.rat) ?? [];
      list.push(cell);
      map.set(cell.rat, list);
    }
    return map;
  }, [cells]);

  if (selectedRats.length === 0) {
    return (
      <div className="border rounded-xl h-full min-h-32 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
        {t("ratSelector.noSelection")}
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {selectedRats.map((rat) => (
        <CellDetailsForm
          key={rat}
          rat={rat}
          cells={cellsByRat.get(rat) ?? []}
          originalCells={originalCells}
          isNewStation={isNewStation}
          cellErrors={cellErrors}
          onCellsChange={onCellsChange}
        />
      ))}
    </div>
  );
}
