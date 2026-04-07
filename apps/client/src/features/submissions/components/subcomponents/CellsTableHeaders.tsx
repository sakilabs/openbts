import type { TFunction } from "i18next";

import { getTableHeaders } from "@/features/admin/cells/cellsTableHeaders";

import type { RatType } from "../../types";

type CellsTableHeadersProps = {
  rat: RatType;
  tStation: TFunction<"translation", undefined>;
};

export function CellsTableHeaders({ rat, tStation }: CellsTableHeadersProps) {
  const headers = getTableHeaders(rat, tStation, { showConfirmed: false });

  return (
    <thead>
      <tr className="border-b bg-muted/30">
        {headers.map((header) => (
          <th key={header} className="px-4 py-2 text-left font-medium text-muted-foreground text-xs">
            {header}
          </th>
        ))}
      </tr>
    </thead>
  );
}
