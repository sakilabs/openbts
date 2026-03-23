import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useReactTable, getCoreRowModel, type Updater, type PaginationState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { createCommentsColumns } from "./commentsColumns";
import type { AdminComment } from "../types";

interface CommentsDataTableProps {
  data: AdminComment[];
  isLoading?: boolean;
  total: number;
  pageIndex: number;
  pageSize: number;
  sortBy: "createdAt" | "id";
  sort: "asc" | "desc";
  onSort: (col: "createdAt" | "id") => void;
  onPageChange: (index: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (comment: AdminComment) => void;
  onDelete: (comment: AdminComment) => void;
  onApprove: (comment: AdminComment) => void;
  onOpenLightbox: (comment: AdminComment, index: number) => void;
}

export function CommentsDataTable({
  data,
  isLoading,
  total,
  pageIndex,
  pageSize,
  sortBy,
  sort,
  onSort,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onApprove,
  onOpenLightbox,
}: CommentsDataTableProps) {
  "use no memo";
  const { t, i18n } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");

  const columns = useMemo(
    () => createCommentsColumns({ t, tCommon, locale: i18n.language, sortBy, sort, onSort, onEdit, onDelete, onApprove, onOpenLightbox }),
    [t, tCommon, i18n.language, sortBy, sort, onSort, onEdit, onDelete, onApprove, onOpenLightbox],
  );

  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize]);

  const onPaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      if (next.pageIndex !== pageIndex) onPageChange(next.pageIndex);
      if (next.pageSize !== pageSize) onPageSizeChange(next.pageSize);
    },
    [pagination, pageIndex, pageSize, onPageChange, onPageSizeChange],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
    state: { pagination },
    onPaginationChange,
  });

  const columnCount = columns.length;
  const showSkeleton = isLoading && data.length === 0;
  const isEmpty = !isLoading && data.length === 0;

  return (
    <div className="h-full overflow-x-auto overflow-y-auto">
      <DataTable.Root table={table}>
        <DataTable.Table>
          <DataTable.Header />
          {showSkeleton ? (
            <DataTable.Skeleton rows={pageSize} columns={columnCount} />
          ) : isEmpty ? (
            <tbody>
              <DataTable.Empty columns={columnCount}>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <span>{t("comments.table.empty")}</span>
                  <span className="text-sm">{t("comments.table.emptyHint")}</span>
                </div>
              </DataTable.Empty>
            </tbody>
          ) : (
            <DataTable.Body />
          )}
          <DataTable.Footer columns={columnCount}>
            <DataTablePagination table={table} totalItems={total} pageSizeOptions={[10, 25, 50, 100]} />
          </DataTable.Footer>
        </DataTable.Table>
      </DataTable.Root>
    </div>
  );
}
