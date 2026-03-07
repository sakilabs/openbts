import { useState, useMemo, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Delete02Icon, Globe02Icon, LockIcon, AlertCircleIcon, ListViewIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useTablePagination } from "@/hooks/useTablePageSize";
import { fetchUserLists, deleteList, type UserListSummary } from "@/features/lists/api";
import { formatShortDate } from "@/lib/format";

const columnHelper = createColumnHelper<UserListSummary>();

function AdminListsPage() {
  "use no memo";
  const { t, i18n } = useTranslation(["admin", "common"]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { containerRef, pagination, setPagination } = useTablePagination({
    rowHeight: 64,
    headerHeight: 40,
    paginationHeight: 45,
  });

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [listToDelete, setListToDelete] = useState<UserListSummary | null>(null);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [setPagination],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "lists", pagination.pageIndex, pagination.pageSize, debouncedSearch],
    queryFn: () => fetchUserLists(pagination.pageSize, pagination.pageIndex + 1, debouncedSearch || undefined),
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const deleteMutation = useMutation({
    mutationFn: deleteList,
    onSuccess: () => {
      toast.success(t("admin:lists.deleteSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["admin", "lists"] });
      setListToDelete(null);
    },
    onError: () => {
      toast.error(t("admin:lists.deleteError"));
    },
  });

  const lists = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;

  const handleDeleteClick = useCallback((list: UserListSummary) => setListToDelete(list), []);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("admin:lists.table.name"),
        size: 240,
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.name}</div>
            {row.original.description && <div className="truncate text-xs text-muted-foreground">{row.original.description}</div>}
          </div>
        ),
      }),
      columnHelper.accessor("createdBy", {
        header: t("admin:lists.table.createdBy"),
        size: 180,
        cell: ({ getValue }) => {
          const by = getValue();
          if (!by?.name) return <span className="text-muted-foreground italic text-xs">—</span>;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="size-6 shrink-0">
                <AvatarFallback className="text-[10px]">{by.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{by.name}</div>
                {by.username && <div className="truncate text-xs text-muted-foreground">@{by.username}</div>}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("is_public", {
        header: t("admin:lists.table.visibility"),
        size: 110,
        cell: ({ getValue }) =>
          getValue() ? (
            <Badge variant="secondary" className="gap-1">
              <HugeiconsIcon icon={Globe02Icon} className="size-3" />
              {t("admin:lists.table.public")}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <HugeiconsIcon icon={LockIcon} className="size-3" />
              {t("admin:lists.table.private")}
            </Badge>
          ),
      }),
      columnHelper.accessor("stationCount", {
        header: t("admin:lists.table.stations"),
        size: 100,
        cell: ({ getValue }) => <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{getValue()}</span>,
      }),
      columnHelper.accessor("radiolineCount", {
        header: t("admin:lists.table.radiolines"),
        size: 110,
        cell: ({ getValue }) => <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{getValue()}</span>,
      }),
      columnHelper.accessor("createdAt", {
        header: t("common:labels.created"),
        size: 130,
        cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums text-xs">{formatShortDate(getValue(), i18n.language)}</span>,
      }),
      columnHelper.display({
        id: "actions",
        size: 56,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row.original);
            }}
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
          </Button>
        ),
      }),
    ],
    [t, i18n.language, handleDeleteClick],
  );

  const handleRowClick = useCallback((list: UserListSummary) => navigate({ to: `/lists/${list.uuid}` }), [navigate]);

  function renderTableBody() {
    if (isLoading) {
      return <DataTable.Skeleton rows={pagination.pageSize} columns={columns.length} />;
    }
    if (isError) {
      return (
        <tbody>
          <tr>
            <td colSpan={columns.length} className="h-64 text-center">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <div className="size-10 rounded-full bg-destructive/5 flex items-center justify-center text-destructive/50 mb-3">
                  <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
                </div>
                <p>{t("common:error.title")}</p>
              </div>
            </td>
          </tr>
        </tbody>
      );
    }
    if (lists.length === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={columns.length} className="h-64 text-center">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <HugeiconsIcon icon={ListViewIcon} className="size-10 mb-2 opacity-20" />
                <p className="font-medium">{t("admin:lists.table.empty")}</p>
                <p className="text-sm opacity-70">{t("admin:lists.table.emptyHint")}</p>
              </div>
            </td>
          </tr>
        </tbody>
      );
    }
    return <DataTable.Body onRowClick={handleRowClick} />;
  }

  const table = useReactTable({
    data: lists,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: { pagination },
    onPaginationChange: setPagination,
  });

  return (
    <>
      <div className="flex-1 flex flex-col p-3 gap-3 min-h-0 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("admin:breadcrumbs.lists")}</h1>
          </div>
          <div className="relative w-full md:max-w-xs">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            />
            <Input placeholder={t("common:placeholder.search")} value={search} onChange={handleSearchChange} className="pl-8" />
          </div>
        </div>

        <div ref={containerRef} className="flex-1 h-full overflow-x-auto overflow-y-hidden">
          <DataTable.Root table={table}>
            <DataTable.Table>
              <DataTable.Header />
              {renderTableBody()}
              <DataTable.Footer columns={columns.length}>
                <DataTablePagination table={table} totalItems={totalCount} showRowsPerPage={false} />
              </DataTable.Footer>
            </DataTable.Table>
          </DataTable.Root>
        </div>
      </div>

      <AlertDialog open={!!listToDelete} onOpenChange={(open) => !open && setListToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin:lists.confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin:lists.confirmDeleteDesc", { name: listToDelete?.name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => listToDelete && deleteMutation.mutate(listToDelete.uuid)}
              disabled={deleteMutation.isPending}
            >
              {t("common:actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const Route = createFileRoute("/_layout/admin/_layout/lists/")({
  component: AdminListsPage,
  staticData: {
    titleKey: "breadcrumbs.lists",
    i18nNamespace: "admin",
    breadcrumbs: [{ titleKey: "breadcrumbs.admin", path: "/admin/stations", i18nNamespace: "admin" }],
    allowedRoles: ["admin"],
  },
});
