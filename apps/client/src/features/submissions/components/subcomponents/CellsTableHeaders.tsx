import type { TFunction } from "i18next";

import { RatCellsTableHeader } from "@/features/shared/RatCellsTableHeader";

import type { RatType } from "../../types";

type CellsTableHeadersProps = {
  rat: RatType;
  tStation: TFunction<"translation", undefined>;
  showSectors?: boolean;
};

export function CellsTableHeaders({ rat, tStation, showSectors }: CellsTableHeadersProps) {
  return <RatCellsTableHeader rat={rat} t={tStation} showSectors={showSectors} showConfirmed={false} />;
}
