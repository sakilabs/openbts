import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useReactTable, getCoreRowModel, getPaginationRowModel } from "@tanstack/react-table";
import { useTablePagination } from "@/hooks/useTablePageSize";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { createLocationsColumns } from "./locationsColumns";
import type { LocationWithStations, LocationSortBy, LocationSortDirection } from "@/types/station";

interface LocationsDataTableProps {
  data: LocationWithStations[];
  isLoading?: boolean;
  isFetchingMore?: boolean;
  onRowClick?: (location: LocationWithStations) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  totalItems?: number;
  sort: LocationSortDirection;
  sortBy: LocationSortBy | undefined;
  onSort: (column: LocationSortBy) => void;
}

export function LocationsDataTable({
  data,
  isLoading,
  isFetchingMore,
  onRowClick,
  onLoadMore,
  hasMore,
  totalItems,
  sort,
  sortBy,
  onSort,
}: LocationsDataTableProps) {
  const { t, i18n } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");

  const { containerRef, pagination, setPagination } = useTablePagination({
    rowHeight: 64,
    headerHeight: 40,
    paginationHeight: 45,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: Already changes on `i18n.language`
  const columns = useMemo(
    () => createLocationsColumns({ t, tCommon, locale: i18n.language, sort, sortBy, onSort }),
    [i18n.language, sort, sortBy, onSort],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
    autoResetPageIndex: true,
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
            <DataTable.Body onRowClick={onRowClick} skeletonRows={skeletonRowsToShow} skeletonColumns={columnCount} />
          )}
          <DataTable.Footer columns={columnCount}>
            <DataTablePagination table={table} totalItems={totalItems ?? data.length} showRowsPerPage={false} />
          </DataTable.Footer>
        </DataTable.Table>
      </DataTable.Root>
    </div>
  );
}
