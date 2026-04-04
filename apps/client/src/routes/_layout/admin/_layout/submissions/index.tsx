import { useState, useMemo, useCallback, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { PaginationState } from "@/hooks/useTablePageSize";
import { useTranslation } from "react-i18next";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { fetchJson, API_BASE } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useTablePagination } from "@/hooks/useTablePageSize";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { SUBMISSION_STATUS, SUBMISSION_TYPE } from "@/features/admin/submissions/submissionUI";
import type { SubmissionListItem } from "@/features/admin/submissions/types";
import { formatShortDate, resolveAvatarUrl } from "@/lib/format";

const TABLE_PAGINATION_CONFIG = { rowHeight: 64, headerHeight: 40, paginationHeight: 45 };

const columnHelper = createColumnHelper<SubmissionListItem>();

function AdminSubmissionsListPage() {
  "use no memo";
  const { t, i18n } = useTranslation(["submissions", "common"]);
  const navigate = useNavigate();
  const { page, q } = Route.useSearch();

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">(() => {
    const saved = localStorage.getItem("admin:submissions:status");
    return saved === "all" || saved === "pending" || saved === "approved" || saved === "rejected" ? saved : "pending";
  });
  const [typeFilter, setTypeFilter] = useState<"all" | "new" | "update" | "delete">(() => {
    const saved = localStorage.getItem("admin:submissions:type");
    return saved === "all" || saved === "new" || saved === "update" || saved === "delete" ? saved : "all";
  });
  const [searchInput, setSearchInput] = useState(q ?? "");
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300) || undefined;

  useEffect(() => {
    void navigate({
      from: Route.fullPath,
      search: (s) => ({ ...s, q: debouncedSearch, page: 0 }),
      replace: true,
    });
  }, [debouncedSearch, navigate]);

  const handleStatusFilter = useCallback(
    (v: typeof statusFilter) => {
      setStatusFilter(v);
      localStorage.setItem("admin:submissions:status", v);
      void navigate({ from: Route.fullPath, search: (s) => ({ ...s, page: 0 }), replace: true });
    },
    [navigate],
  );

  const handleTypeFilter = useCallback(
    (v: typeof typeFilter) => {
      setTypeFilter(v);
      localStorage.setItem("admin:submissions:type", v);
      void navigate({ from: Route.fullPath, search: (s) => ({ ...s, page: 0 }), replace: true });
    },
    [navigate],
  );

  const { containerRef, pagination: sizePagination, setPagination: setSizePagination, pageSizeOptions } = useTablePagination(TABLE_PAGINATION_CONFIG);

  const pagination = useMemo(() => ({ pageIndex: page, pageSize: sizePagination.pageSize }), [page, sizePagination.pageSize]);

  const setPagination = useCallback(
    (updater: PaginationState | ((prev: PaginationState) => PaginationState)) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      if (next.pageSize !== pagination.pageSize) setSizePagination(next);
      if (next.pageIndex !== pagination.pageIndex)
        void navigate({ from: Route.fullPath, search: (s) => ({ ...s, page: next.pageIndex }), replace: true });
    },
    [pagination, setSizePagination, navigate],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "submissions", pagination.pageIndex, pagination.pageSize, statusFilter, typeFilter, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", pagination.pageSize.toString());
      params.set("offset", (pagination.pageIndex * pagination.pageSize).toString());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      return fetchJson<{ data: SubmissionListItem[]; totalCount: number }>(`${API_BASE}/submissions?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const submissions = data?.data ?? [];
  const total = data?.totalCount ?? 0;

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: t("common:labels.id"),
        size: 80,
        cell: ({ getValue }) => {
          const id = getValue();
          const lastPart = id.slice(-8);
          return <span className="font-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">{lastPart}</span>;
        },
      }),
      columnHelper.accessor("type", {
        header: t("common:labels.type"),
        size: 100,
        cell: ({ getValue }) => {
          const type = getValue();
          const typeCfg = SUBMISSION_TYPE[type];
          return (
            <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase border", typeCfg.badgeClass)}>
              <span className={cn("size-1.5 rounded-[1px]", typeCfg.dotClass)} />
              {t(`common:submissionType.${type}`)}
            </span>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: t("common:labels.status"),
        size: 120,
        cell: ({ getValue }) => {
          const status = getValue();
          const statusCfg = SUBMISSION_STATUS[status];
          return (
            <div className={cn("flex items-center gap-1.5 w-fit px-2 py-1 rounded-md", statusCfg.bgClass)}>
              <HugeiconsIcon icon={statusCfg.icon} className={cn("size-3.5", statusCfg.iconClass)} />
              <span className="text-xs font-medium capitalize">{t(`common:status.${status}`)}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("station", {
        header: t("common:labels.station"),
        cell: ({ getValue, row }) => {
          const station = getValue();
          const proposedStation = row.original.proposedStation;
          if (station) return <div className="font-mono font-medium">{station.station_id}</div>;
          if (proposedStation?.station_id) return <div className="font-mono font-medium">{proposedStation.station_id}</div>;
          return <span className="text-muted-foreground italic text-xs">{t("common:labels.newStation")}</span>;
        },
      }),
      columnHelper.accessor("submitter", {
        header: t("detail.submitter"),
        cell: ({ getValue }) => {
          const submitter = getValue();
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="size-6 shrink-0">
                <AvatarImage src={resolveAvatarUrl(submitter.image)} />
                <AvatarFallback className="text-[10px]">{submitter.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{submitter.name}</div>
                {submitter.username && <div className="truncate text-xs text-muted-foreground">@{submitter.username}</div>}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("cells", {
        header: t("table.cells"),
        size: 120,
        cell: ({ getValue }) => <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{getValue().length}</span>,
      }),
      columnHelper.accessor("createdAt", {
        header: t("common:labels.submitted"),
        size: 120,
        cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums text-xs">{formatShortDate(getValue(), i18n.language)}</span>,
      }),
      columnHelper.accessor("reviewed_at", {
        header: t("common:labels.reviewed"),
        size: 120,
        cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums text-xs">{formatShortDate(getValue(), i18n.language)}</span>,
      }),
    ],
    [t, i18n.language],
  );

  const handleRowClick = useCallback((submission: SubmissionListItem) => navigate({ to: `/admin/submissions/${submission.id}` }), [navigate]);

  const table = useReactTable({
    data: submissions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: { pagination },
    onPaginationChange: setPagination,
  });

  return (
    <div className="flex-1 flex flex-col p-3 gap-3 min-h-0 overflow-hidden">
      <div className="flex flex-col gap-3 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("adminTitle")}</h1>
            <p className="text-muted-foreground text-sm">{t("adminDescription")}</p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
            <div className="flex items-center p-1 bg-muted/50 rounded-lg border">
              {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusFilter(status)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                    statusFilter === status
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  {status === "all" ? t("common:status.all", "All") : t(`common:status.${status}`)}
                </button>
              ))}
            </div>

            <div className="flex items-center p-1 bg-muted/50 rounded-lg border">
              {(["all", "new", "update", "delete"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeFilter(type)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                    typeFilter === type
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  {type === "all" ? t("common:submissionType.all", "All") : t(`common:submissionType.${type}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none"
          />
          <Input
            className="h-8 pl-8 pr-8 w-full sm:w-72"
            placeholder={t("table.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 h-full overflow-x-auto overflow-y-auto overscroll-y-contain">
        <DataTable.Root table={table}>
          <DataTable.Table>
            <DataTable.Header />
            {isLoading ? (
              <DataTable.Skeleton rows={pagination.pageSize} columns={columns.length} />
            ) : isError ? (
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
            ) : submissions.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={columns.length} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <HugeiconsIcon icon={Search01Icon} className="size-10 mb-2 opacity-20" />
                      <p className="font-medium">{t("table.empty")}</p>
                      <p className="text-sm opacity-70">{t("table.emptyHint")}</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <DataTable.Body onRowClick={handleRowClick} />
            )}
            <DataTable.Footer columns={columns.length}>
              <DataTablePagination table={table} totalItems={total} pageSizeOptions={pageSizeOptions} />
            </DataTable.Footer>
          </DataTable.Table>
        </DataTable.Root>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_layout/admin/_layout/submissions/")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: typeof search.page === "number" && search.page >= 0 ? Math.floor(search.page) : 0,
    q: typeof search.q === "string" && search.q ? search.q : undefined,
  }),
  component: AdminSubmissionsListPage,
  staticData: {
    titleKey: "breadcrumbs.submissions",
    i18nNamespace: "admin",
    breadcrumbs: [{ titleKey: "breadcrumbs.admin", path: "/admin/stations", i18nNamespace: "admin" }],
    allowedRoles: ["admin", "editor"],
  },
});
