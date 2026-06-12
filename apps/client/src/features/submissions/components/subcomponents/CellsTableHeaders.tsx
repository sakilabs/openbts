import type { TFunction } from "i18next";

import { getTableHeaders } from "@/features/admin/cells/cellsTableHeaders";

import type { RatType } from "../../types";

type CellsTableHeadersProps = {
  rat: RatType;
  tStation: TFunction<"translation", undefined>;
  showSectors?: boolean;
};

export function CellsTableHeaders({ rat, tStation, showSectors }: CellsTableHeadersProps) {
  const headers = getTableHeaders(rat, tStation, { showConfirmed: false });
  const sectorHeaderIndex = rat === "GSM" ? 1 : 2;
  const displayedHeaders = showSectors ? [...headers.slice(0, sectorHeaderIndex), "S", ...headers.slice(sectorHeaderIndex)] : headers;

  return (
    <thead>
      <tr className="border-b bg-muted/30">
        {displayedHeaders.map((header) => (
          <th key={header} className="px-4 py-2 text-left font-medium text-muted-foreground text-xs">
            {header}
          </th>
        ))}
      </tr>
    </thead>
  );
}
