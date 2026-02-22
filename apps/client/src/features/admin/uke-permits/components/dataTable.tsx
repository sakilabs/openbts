import { useMemo, type Dispatch, type SetStateAction, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon, MapPinIcon } from "@hugeicons/core-free-icons";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { createUnassignedPermitsColumns } from "./columns";
import type { UkeStation } from "@/types/station";

interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

interface UnassignedPermitsDataTableProps {
  data: UkeStation[];
  isLoading?: boolean;
  onOpenDetails?: (station: UkeStation) => void;
  onViewOnMap?: (station: UkeStation) => void;
  totalItems: number;
  containerRef: RefObject<HTMLDivElement | null>;
  pagination: PaginationState;
  setPagination: Dispatch<SetStateAction<PaginationState>>;
}

export function UnassignedPermitsDataTable({
  data,
  isLoading,
  onOpenDetails,
  onViewOnMap,
  totalItems,
  containerRef,
  pagination,
  setPagination,
}: UnassignedPermitsDataTableProps) {
  "use no memo";
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");

  const columns = useMemo(() => createUnassignedPermitsColumns({ t, tCommon }), [t, tCommon]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalItems / pagination.pageSize),
    state: { pagination },
    onPaginationChange: setPagination,
  });

  const columnCount = columns.length;
  const showSkeleton = isLoading;
  const isEmpty = !isLoading && table.getRowModel().rows.length === 0;
  const rows = table.getRowModel().rows;

  return (
    <div ref={containerRef} className="h-full overflow-x-auto overflow-y-hidden">
      <DataTable.Root table={table}>
        <DataTable.Table>
          <DataTable.Header />
          {showSkeleton ? (
            <DataTable.Skeleton rows={pagination.pageSize} columns={columnCount} />
          ) : isEmpty ? (
            <tbody>
              <DataTable.Empty columns={columnCount}>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <span>{t("main:search.noResults")}</span>
                  <span className="text-sm">{t("main:search.noResultsHint")}</span>
                </div>
              </DataTable.Empty>
            </tbody>
          ) : (
            <tbody className="[&_tr:last-child]:border-0">
              {rows.map((row) => (
                <DropdownMenu key={row.id}>
                  <DropdownMenuTrigger
                    render={
                      <tr
                        data-state={row.getIsSelected() ? "selected" : undefined}
                        className="h-16 border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                      />
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-2 align-middle overflow-hidden" style={{ width: cell.column.getSize() }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-auto">
                    <DropdownMenuItem onClick={() => onOpenDetails?.(row.original)}>
                      <HugeiconsIcon icon={InformationCircleIcon} className="size-4" />
                      {t("ukePermits.openDetails")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewOnMap?.(row.original)}>
                      <HugeiconsIcon icon={MapPinIcon} className="size-4" />
                      {t("ukePermits.viewOnMap")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </tbody>
          )}
          <DataTable.Footer columns={columnCount}>
            <div className="sticky left-0">
              <DataTablePagination table={table} totalItems={totalItems} showRowsPerPage={false} />
            </div>
          </DataTable.Footer>
        </DataTable.Table>
      </DataTable.Root>
    </div>
  );
}
