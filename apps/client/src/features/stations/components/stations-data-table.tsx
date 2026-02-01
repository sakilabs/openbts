import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useReactTable, getCoreRowModel, getPaginationRowModel } from "@tanstack/react-table";
import { useTablePagination } from "@/hooks/use-table-page-size";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { createStationsColumns } from "./stations-columns";
import type { Station } from "@/types/station";

interface StationsDataTableProps {
	data: Station[];
	isLoading?: boolean;
	isFetchingMore?: boolean;
	onRowClick?: (station: Station) => void;
	onLoadMore?: () => void;
	hasMore?: boolean;
	totalItems?: number;
	isSearchActive?: boolean;
}

export function StationsDataTable({
	data,
	isLoading,
	isFetchingMore,
	onRowClick,
	onLoadMore,
	hasMore,
	totalItems,
	isSearchActive = false,
}: StationsDataTableProps) {
	const { t, i18n } = useTranslation("stations");
	const { t: tCommon } = useTranslation("common");

	const { containerRef, pagination, setPagination } = useTablePagination({
		rowHeight: 64,
		headerHeight: 40,
		paginationHeight: 45,
	});

	const columns = useMemo(
		() => createStationsColumns({ t, tCommon, locale: i18n.language, isSearchActive }),
		[t, tCommon, i18n.language, isSearchActive],
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
		<div ref={containerRef} className="h-full overflow-auto">
			<DataTable.Root table={table}>
				<DataTable.Table>
					<DataTable.Header />
					{showSkeleton ? (
						<DataTable.Skeleton rows={pagination.pageSize} columns={columnCount} />
					) : isEmpty ? (
						<tbody>
							<DataTable.Empty columns={columnCount}>
								<div className="flex flex-col items-center gap-2 text-muted-foreground">
									<span>{t("table.noStationsFound")}</span>
									<span className="text-sm">{t("table.tryAdjustingFilters")}</span>
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
