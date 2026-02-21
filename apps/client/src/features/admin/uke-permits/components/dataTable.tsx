import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon, MapPinIcon } from "@hugeicons/core-free-icons";
import { useTablePagination } from "@/hooks/useTablePageSize";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { createUnassignedPermitsColumns } from "./columns";
import type { UkeStation } from "@/types/station";

interface UnassignedPermitsDataTableProps {
  data: UkeStation[];
  isLoading?: boolean;
  isFetchingMore?: boolean;
  onOpenDetails?: (station: UkeStation) => void;
  onViewOnMap?: (station: UkeStation) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  totalItems?: number;
}

export function UnassignedPermitsDataTable({
  data,
  isLoading,
  isFetchingMore,
  onOpenDetails,
  onViewOnMap,
  onLoadMore,
  hasMore,
  totalItems,
}: UnassignedPermitsDataTableProps) {
  "use no memo";
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");

  const { containerRef, pagination, setPagination } = useTablePagination({
    rowHeight: 64,
    headerHeight: 40,
    paginationHeight: 45,
  });

  const columns = useMemo(() => createUnassignedPermitsColumns({ t, tCommon }), [t, tCommon]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
  });

  const pageCount = table.getPageCount();
  const columnCount = columns.length;

  useEffect(() => {
    if (hasMore && onLoadMore && pagination.pageIndex + 1 >= pageCount - 2) onLoadMore();
  }, [pagination.pageIndex, pageCount, hasMore, onLoadMore]);

  const showSkeleton = isLoading && data.length === 0;
  const isEmpty = !isLoading && table.getRowModel().rows.length === 0;

  const currentPageRows = table.getRowModel().rows.length;
  const isOnLastLoadedPage = pagination.pageIndex === pageCount - 1;
  const skeletonRowsToShow =
    isFetchingMore && hasMore && isOnLastLoadedPage && currentPageRows < pagination.pageSize ? pagination.pageSize - currentPageRows : 0;

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
              {skeletonRowsToShow > 0 && <DataTable.SkeletonRows rows={skeletonRowsToShow} columns={columnCount} />}
            </tbody>
          )}
          <DataTable.Footer columns={columnCount}>
            <DataTablePagination table={table} totalItems={totalItems ?? data.length} showRowsPerPage={false} />
          </DataTable.Footer>
        </DataTable.Table>
      </DataTable.Root>
    </div>
  );
}
