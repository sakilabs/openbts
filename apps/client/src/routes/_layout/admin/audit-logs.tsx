import { useState, useMemo, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Search01Icon, Cancel01Icon, Sorting05Icon } from "@hugeicons/core-free-icons";
import { fetchJson, API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTablePagination } from "@/hooks/useTablePageSize";
import { DatePickerButton } from "@/features/admin/audit-logs/components/date-picker-button";
import { AuditLogDetailSheet } from "@/features/admin/audit-logs/components/audit-log-detail-sheet";
import { type AuditLogEntry, getActionStyle, TABLE_LABELS, TABLE_OPTIONS, ACTION_GROUPS } from "../../../features/admin/audit-logs/constants";

function formatAuditDate(dateString: string, locale: string): string {
  return new Date(dateString).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

const columnHelper = createColumnHelper<AuditLogEntry>();

function AdminAuditLogsPage() {
  const { t, i18n } = useTranslation(["admin", "common"]);

  const [tableFilter, setTableFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sort, setSort] = useState<"asc" | "desc">("desc");

  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const { containerRef, pagination, setPagination } = useTablePagination({
    rowHeight: 64,
    headerHeight: 40,
    paginationHeight: 45,
  });

  const resetPage = useCallback(() => setPagination((prev) => ({ ...prev, pageIndex: 0 })), [setPagination]);

  const hasActiveFilters = !!(tableFilter || actionFilter || dateFrom || dateTo);
  const activeFilterCount = [tableFilter, actionFilter, dateFrom, dateTo].filter(Boolean).length;

  const clearAllFilters = useCallback(() => {
    setTableFilter("");
    setActionFilter("");
    setDateFrom("");
    setDateTo("");
    resetPage();
  }, [resetPage]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "audit-logs", pagination.pageIndex, pagination.pageSize, tableFilter, actionFilter, dateFrom, dateTo, sort],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", pagination.pageSize.toString());
      params.set("offset", (pagination.pageIndex * pagination.pageSize).toString());
      params.set("sort", sort);
      if (tableFilter) params.set("table_name", tableFilter);
      if (actionFilter) params.set("action", actionFilter);
      if (dateFrom) params.set("from", new Date(dateFrom).toISOString());
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        params.set("to", to.toISOString());
      }
      return fetchJson<{ data: AuditLogEntry[]; totalCount: number }>(`${API_BASE}/audit-logs?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const logs = data?.data ?? [];
  const total = data?.totalCount ?? 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: Already changes on `i18n.language`
  const columns = useMemo(
    () => [
      columnHelper.accessor("createdAt", {
        header: () => (
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-foreground -ml-1 px-1 py-0.5 rounded transition-colors"
            onClick={() => {
              setSort((s) => (s === "desc" ? "asc" : "desc"));
              resetPage();
            }}
          >
            {t("auditLogs.columns.timestamp")}
            <HugeiconsIcon
              icon={Sorting05Icon}
              className="size-3.5 text-foreground"
              style={sort === "asc" ? { transform: "scaleY(-1)" } : undefined}
            />
          </button>
        ),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground tabular-nums text-xs font-mono">{formatAuditDate(getValue(), i18n.language)}</span>
        ),
      }),
      columnHelper.accessor("user", {
        header: t("auditLogs.columns.actor"),
        size: 180,
        cell: ({ getValue }) => {
          const user = getValue();
          if (!user) {
            return <span className="text-muted-foreground italic text-xs">{t("auditLogs.actor.system")}</span>;
          }
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="text-[9px]">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="truncate max-w-28 text-xs font-medium">{user.name}</span>
                {user.displayUsername && <span className="truncate max-w-28 text-[10px] text-muted-foreground">@{user.displayUsername}</span>}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("action", {
        header: t("auditLogs.columns.action"),
        size: 200,
        cell: ({ getValue }) => {
          const action = getValue();
          const style = getActionStyle(action);
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                style.badgeClass,
              )}
            >
              <span className={cn("size-1.5 rounded-full", style.dotClass)} />
              {action}
            </span>
          );
        },
      }),
      columnHelper.accessor("table_name", {
        header: t("auditLogs.columns.entity"),
        size: 120,
        cell: ({ getValue }) => <span className="text-xs font-medium">{TABLE_LABELS[getValue()] ?? getValue()}</span>,
      }),
      columnHelper.accessor("record_id", {
        header: t("auditLogs.columns.record"),
        size: 100,
        cell: ({ getValue, row }) => {
          const recordId = getValue();
          const fallbackId =
            (row.original.old_values as Record<string, unknown> | null)?.id ??
            (row.original.new_values as Record<string, unknown> | null)?.id ??
            null;
          const displayId = recordId ?? fallbackId;
          return displayId !== null ? (
            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">#{String(displayId)}</span>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          );
        },
      }),
      columnHelper.accessor("source", {
        header: t("auditLogs.columns.source"),
        size: 80,
        cell: ({ getValue }) => <span className="text-xs text-muted-foreground uppercase">{getValue() ?? "—"}</span>,
      }),
    ],
    [i18n.language, sort],
  );

  const table = useReactTable({
    data: logs,
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
            <h1 className="text-2xl font-bold tracking-tight">{t("auditLogs.title")}</h1>
            <p className="text-muted-foreground text-sm">{t("auditLogs.subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={tableFilter}
            onValueChange={(v) => {
              setTableFilter(v === "__all__" ? "" : (v as string));
              resetPage();
            }}
          >
            <SelectTrigger className="min-w-35">
              <SelectValue placeholder={t("auditLogs.filters.allEntities")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("auditLogs.filters.allEntities")}</SelectItem>
              {TABLE_OPTIONS.map((table) => (
                <SelectItem key={table} value={table}>
                  {TABLE_LABELS[table]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={actionFilter}
            onValueChange={(v) => {
              setActionFilter(v === "__all__" ? "" : (v as string));
              resetPage();
            }}
          >
            <SelectTrigger className="min-w-42.5">
              <SelectValue placeholder={t("auditLogs.filters.allActions")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("auditLogs.filters.allActions")}</SelectItem>
              {ACTION_GROUPS.map((group, i) => (
                <SelectGroup key={group.label}>
                  {i > 0 && <SelectSeparator />}
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.actions.map((action) => (
                    <SelectItem key={action} value={action}>
                      <span className="font-mono text-xs">{action.split(".").pop()}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          <DatePickerButton
            value={dateFrom}
            onChange={(v) => {
              setDateFrom(v);
              resetPage();
            }}
            label={t("auditLogs.filters.dateFrom")}
          />

          <DatePickerButton
            value={dateTo}
            onChange={(v) => {
              setDateTo(v);
              resetPage();
            }}
            label={t("auditLogs.filters.dateTo")}
          />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
              <HugeiconsIcon icon={Cancel01Icon} className="size-3" data-icon="inline-start" />
              {t("common:actions.clearAll")}
              <span className="ml-1 bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
                {activeFilterCount}
              </span>
            </Button>
          )}
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
            ) : logs.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={columns.length} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <HugeiconsIcon icon={Search01Icon} className="size-10 mb-2 opacity-20" />
                      <p className="font-medium">{t("auditLogs.empty.title")}</p>
                      <p className="text-sm opacity-70">{t("auditLogs.empty.subtitle")}</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <DataTable.Body onRowClick={(row: AuditLogEntry) => setSelectedEntry(row)} />
            )}
            <DataTable.Footer columns={columns.length}>
              <DataTablePagination table={table} totalItems={total} showRowsPerPage={false} />
            </DataTable.Footer>
          </DataTable.Table>
        </DataTable.Root>
      </div>

      <AuditLogDetailSheet
        entry={selectedEntry}
        open={selectedEntry !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedEntry(null);
        }}
      />
    </div>
  );
}

export const Route = createFileRoute("/_layout/admin/audit-logs")({
  component: AdminAuditLogsPage,
  staticData: {
    titleKey: "auditLogs.title",
    i18nNamespace: "admin",
    breadcrumbs: [{ titleKey: "breadcrumbs.admin", path: "/admin/stations", i18nNamespace: "admin" }],
    allowedRoles: ["admin"],
  },
});
