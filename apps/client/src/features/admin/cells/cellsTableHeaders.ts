import type { TFunction } from "i18next";

import { getRatCellsTableHeaders } from "@/features/shared/RatCellsTableHeader";

export function getTableHeaders(rat: string, t: TFunction, options?: { showConfirmed?: boolean }): string[] {
  return getRatCellsTableHeaders(rat, t, options);
}
