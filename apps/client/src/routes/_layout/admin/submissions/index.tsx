import { useState, useMemo, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { FilterIcon, AlertCircleIcon } from "@hugeicons/core-free-icons";
import { fetchJson, API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useTablePagination } from "@/hooks/useTablePageSize";
import { SUBMISSION_STATUS, SUBMISSION_TYPE } from "@/features/admin/submissions/submissionUI";
import type { SubmissionListItem } from "@/features/admin/submissions/types";
import { formatShortDate } from "@/lib/format";

const columnHelper = createColumnHelper<SubmissionListItem>();

function AdminSubmissionsListPage() {
  const { t, i18n } = useTranslation(["submissions", "common"]);
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">(() => {
    const saved = localStorage.getItem("admin:submissions:status");
    return saved === "all" || saved === "pending" || saved === "approved" || saved === "rejected" ? saved : "pending";
  });
  const [typeFilter, setTypeFilter] = useState<"all" | "new" | "update" | "delete">(() => {
    const saved = localStorage.getItem("admin:submissions:type");
    return saved === "all" || saved === "new" || saved === "update" || saved === "delete" ? saved : "all";
  });

  const handleStatusFilter = useCallback((v: typeof statusFilter) => {
    setStatusFilter(v);
    localStorage.setItem("admin:submissions:status", v);
  }, []);

  const handleTypeFilter = useCallback((v: typeof typeFilter) => {
    setTypeFilter(v);
    localStorage.setItem("admin:submissions:type", v);
  }, []);

  const { containerRef, pagination, setPagination } = useTablePagination({
    rowHeight: 64,
    headerHeight: 40,
    paginationHeight: 45,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "submissions", pagination.pageIndex, pagination.pageSize, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", pagination.pageSize.toString());
      params.set("offset", (pagination.pageIndex * pagination.pageSize).toString());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);

      return fetchJson<{ data: SubmissionListItem[]; totalCount: number }>(`${API_BASE}/submissions?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const submissions = data?.data ?? [];
  const total = data?.totalCount ?? 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: Already changes on `i18n.language`
  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: t("common:labels.id"),
        size: 100,
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
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                typeCfg.badgeClass,
              )}
            >
              <span className={cn("size-1.5 rounded-full", typeCfg.dotClass)} />
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
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage src={submitter.image ?? undefined} />
                <AvatarFallback className="text-[10px]">{submitter.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="truncate max-w-37.5 text-sm">{submitter.name}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("cells", {
        header: t("table.cells"),
        size: 80,
        cell: ({ getValue }) => <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{getValue().length}</span>,
      }),
      columnHelper.accessor("createdAt", {
        header: t("common:labels.submitted"),
        size: 140,
        cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums text-xs">{formatShortDate(getValue(), i18n.language)}</span>,
      }),
      columnHelper.accessor("reviewed_at", {
        header: t("common:labels.reviewed"),
        size: 140,
        cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums text-xs">{formatShortDate(getValue(), i18n.language)}</span>,
      }),
    ],
    [i18n.language],
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("adminTitle")}</h1>
          <p className="text-muted-foreground text-sm">{t("adminDescription")}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
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

      <div ref={containerRef} className="flex-1 h-full overflow-x-auto overflow-y-hidden">
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
                      <HugeiconsIcon icon={FilterIcon} className="size-10 mb-2 opacity-20" />
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
              <DataTablePagination table={table} totalItems={total} showRowsPerPage={false} />
            </DataTable.Footer>
          </DataTable.Table>
        </DataTable.Root>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_layout/admin/submissions/")({
  component: AdminSubmissionsListPage,
  staticData: {
    titleKey: "breadcrumbs.submissions",
    i18nNamespace: "admin",
    breadcrumbs: [{ titleKey: "breadcrumbs.admin", path: "/admin/stations", i18nNamespace: "admin" }],
    allowedRoles: ["admin", "editor"],
  },
});
