import { MapsIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getOperatorColor } from "@openbts/shared/operatorUtils";
import { type ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import type { PaginationState } from "@/hooks/useTablePageSize";
import { formatShortDate } from "@/lib/format";

import type { PlannedPEMStation } from "../api";

type Props = {
  data: PlannedPEMStation[];
  isLoading: boolean;
  totalItems: number;
  pagination: PaginationState;
  onPaginationChange: (updater: PaginationState | ((prev: PaginationState) => PaginationState)) => void;
  pageSizeOptions: number[];
  t: TFunction;
  tCommon: TFunction;
  locale: string;
};

const STATUS_CLASSES: Record<string, string> = {
  PLANNED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  CANCELED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function MeasurementsDataTable({ data, isLoading, totalItems, pagination, onPaginationChange, pageSizeOptions, t, tCommon, locale }: Props) {
  const columns = useMemo<ColumnDef<PlannedPEMStation>[]>(
    () => [
      {
        accessorKey: "station_id",
        header: tCommon("labels.stationId"),
        size: 80,
        cell: ({ getValue }) => <span className="font-mono text-sm text-muted-foreground pl-2">{getValue<string>()}</span>,
      },
      {
        accessorKey: "operator",
        header: tCommon("labels.operator"),
        size: 160,
        cell: ({
          row: {
            original: { operator: op },
          },
        }) => {
          if (!op) return <span className="text-muted-foreground">-</span>;
          return (
            <div className="flex items-start gap-2">
              <div className="size-3 rounded-[2px] shrink-0 mt-1" style={{ backgroundColor: getOperatorColor(op.mnc) }} />
              <div className="flex flex-col">
                <span className="font-medium">{op.name}</span>
                {op.full_name !== op.name && <span className="text-xs text-muted-foreground truncate max-w-40">{op.full_name}</span>}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "date.from",
        header: t("table.dateFrom"),
        size: 140,
        cell: ({ getValue }) => {
          const date = getValue<string>();
          return <p className="text-muted-foreground tabular-nums text-sm">{formatShortDate(date, locale)}</p>;
        },
      },
      {
        accessorKey: "date.to",
        header: t("table.dateTo"),
        size: 140,
        cell: ({ getValue }) => {
          const date = getValue<string>();
          return <p className="text-muted-foreground tabular-nums text-sm">{formatShortDate(date, locale)}</p>;
        },
      },
      {
        accessorKey: "location",
        header: tCommon("labels.location"),
        size: 140,
        cell: ({
          row: {
            original: { location, region },
          },
        }) => {
          const city = location.city;
          const address = location.address;
          const regionName = region?.name ?? null;
          return (
            <>
              <h3 className="font-medium text-sm leading-tight">
                {city || "Unknown"}
                {regionName && <span className="font-normal text-[10px] text-muted-foreground ml-1">· {regionName}</span>}
              </h3>
              {address && <p className="text-[11px] text-muted-foreground">{address}</p>}
            </>
          );
        },
      },
      {
        accessorKey: "lab.name",
        header: t("table.lab"),
        size: 150,
        cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue<string>()}</span>,
      },
      {
        accessorKey: "status",
        header: tCommon("labels.status"),
        size: 80,
        cell: ({ getValue }) => {
          const value = getValue<string>();
          return (
            <Badge variant="outline" className={STATUS_CLASSES[value]}>
              {t(`tabs.${value.toLowerCase() as "planned" | "completed" | "canceled"}`)}
            </Badge>
          );
        },
      },
      {
        id: "map",
        size: 80,
        cell: ({
          row: {
            original: { location },
          },
        }) => (
          <a
            href={`/#map=16.00/${location.latitude.toFixed(6)}/${location.longitude.toFixed(6)}~fp`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/60 hover:border-border"
          >
            <HugeiconsIcon icon={MapsIcon} className="size-3.5 shrink-0" />
            {tCommon("actions.showOnMap")}
          </a>
        ),
      },
    ],
    [t, tCommon, locale],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalItems / pagination.pageSize),
    state: { pagination },
    onPaginationChange,
  });

  return (
    <DataTable.Root table={table}>
      <DataTable.Table>
        <DataTable.Header />
        {isLoading ? <DataTable.Skeleton rows={pagination.pageSize} columns={columns.length} /> : <DataTable.Body />}
        <DataTable.Footer columns={columns.length}>
          <DataTablePagination table={table} totalItems={totalItems} pageSizeOptions={pageSizeOptions} />
        </DataTable.Footer>
      </DataTable.Table>
    </DataTable.Root>
  );
}
