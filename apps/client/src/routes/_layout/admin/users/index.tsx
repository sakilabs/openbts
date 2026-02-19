import { useState, useEffect, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useTablePagination } from "@/hooks/useTablePageSize";
import { authClient } from "@/lib/authClient";
import type { AdminUser } from "@/features/admin/users/types";
const columnHelper = createColumnHelper<AdminUser>();

function useColumns() {
  const { t } = useTranslation("admin");
  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("users.table.name"),
        size: 250,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              {row.original.image && <AvatarImage src={row.original.image} />}
              <AvatarFallback>{row.original.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate font-medium">{row.original.name}</div>
              {row.original.username && <div className="truncate text-xs text-muted-foreground">@{row.original.username}</div>}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("email", {
        header: t("users.table.email"),
        size: 250,
        cell: ({ getValue }) => <span className="truncate">{getValue()}</span>,
      }),
      columnHelper.accessor("role", {
        header: t("users.table.role"),
        size: 120,
        cell: ({ getValue }) => {
          const role = getValue() ?? "user";
          return <Badge variant={role === "admin" ? "default" : "secondary"}>{role}</Badge>;
        },
      }),
      columnHelper.accessor("banned", {
        header: t("users.table.status"),
        size: 120,
        cell: ({ getValue }) => {
          const banned = getValue();
          if (banned) return <Badge variant="destructive">Banned</Badge>;
          return <Badge variant="secondary">Active</Badge>;
        },
      }),
      columnHelper.accessor("createdAt", {
        header: t("users.table.created"),
        size: 150,
        cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
      }),
    ],
    [t],
  );
}

function AdminUsersPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");
  const columns = useColumns();
  const { containerRef, pagination, setPagination } = useTablePagination({
    rowHeight: 48,
    headerHeight: 36,
    paginationHeight: 40,
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  // biome-ignore lint/correctness/useExhaustiveDependencies: It needs to run when debouncedSearch changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, setPagination]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", pagination.pageIndex, pagination.pageSize, debouncedSearch],
    queryFn: async () => {
      const result = await authClient.admin.listUsers({
        query: {
          limit: pagination.pageSize,
          offset: pagination.pageIndex * pagination.pageSize,
          ...(debouncedSearch
            ? {
                searchValue: debouncedSearch,
                searchField: "email" as const,
                searchOperator: "contains" as const,
              }
            : {}),
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });
      if (result.error) throw result.error;
      return result.data;
    },
  });

  const users = (data?.users as AdminUser[]) ?? [];
  const total = data?.total ?? 0;

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: { pagination },
    onPaginationChange: setPagination,
  });

  return (
    <div className="flex-1 flex flex-col p-3 gap-3 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder={t("common:placeholder.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
      </div>

      <div ref={containerRef} className="flex-1 h-full overflow-x-auto overflow-y-hidden">
        <DataTable.Root table={table}>
          <DataTable.Table>
            <DataTable.Header />
            {isLoading ? (
              <DataTable.Skeleton rows={pagination.pageSize} columns={columns.length} />
            ) : (
              <DataTable.Body onRowClick={(user) => navigate({ to: "/admin/users/$id", params: { id: (user as AdminUser).id } })} />
            )}
            <DataTable.Footer columns={columns.length}>
              <DataTablePagination table={table} totalItems={total} showRowsPerPage={false} />
            </DataTable.Footer>
          </DataTable.Table>
        </DataTable.Root>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_layout/admin/users/")({
  component: AdminUsersPage,
  staticData: {
    titleKey: "breadcrumbs.users",
    i18nNamespace: "admin",
    breadcrumbs: [{ titleKey: "breadcrumbs.admin", i18nNamespace: "admin" }],
  },
});
