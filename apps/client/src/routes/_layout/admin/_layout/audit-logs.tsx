import { useReducer, useMemo, useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Search01Icon, Cancel01Icon, Sorting05Icon, ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { fetchJson, API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTablePagination } from "@/hooks/useTablePageSize";
import { DatePickerButton } from "@/features/admin/audit-logs/components/date-picker-button";
import { AuditLogDetailSheet } from "@/features/admin/audit-logs/components/audit-log-detail-sheet";
import { type AuditLogEntry, getActionStyle, TABLE_LABELS, TABLE_OPTIONS, ACTION_GROUPS } from "../../../../features/admin/audit-logs/constants";

const TABLE_PAGINATION_CONFIG = { rowHeight: 64, headerHeight: 40, paginationHeight: 45 };

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

type AuditLogsFilterState = {
  tableFilter: string;
  actionsFilter: string[];
  dateFrom: string;
  dateTo: string;
  recordIdFilter: string;
  sort: "asc" | "desc";
  selectedEntry: AuditLogEntry | null;
};

function auditLogsFilterReducer(
  state: AuditLogsFilterState,
  action:
    | { type: "SET_TABLE_FILTER"; payload: string }
    | { type: "SET_ACTIONS_FILTER"; payload: string[] }
    | { type: "SET_DATE_FROM"; payload: string }
    | { type: "SET_DATE_TO"; payload: string }
    | { type: "SET_RECORD_ID_FILTER"; payload: string }
    | { type: "SET_SORT"; payload: "asc" | "desc" }
    | { type: "SET_SELECTED_ENTRY"; payload: AuditLogEntry | null }
    | { type: "CLEAR_FILTERS" },
): AuditLogsFilterState {
  switch (action.type) {
    case "SET_TABLE_FILTER":
      return { ...state, tableFilter: action.payload };
    case "SET_ACTIONS_FILTER":
      return { ...state, actionsFilter: action.payload };
    case "SET_DATE_FROM":
      return { ...state, dateFrom: action.payload };
    case "SET_DATE_TO":
      return { ...state, dateTo: action.payload };
    case "SET_RECORD_ID_FILTER":
      return { ...state, recordIdFilter: action.payload };
    case "SET_SORT":
      return { ...state, sort: action.payload };
    case "SET_SELECTED_ENTRY":
      return { ...state, selectedEntry: action.payload };
    case "CLEAR_FILTERS":
      return { ...state, tableFilter: "", actionsFilter: [], dateFrom: "", dateTo: "", recordIdFilter: "" };
    default:
      return state;
  }
}

const initialFilterState: AuditLogsFilterState = {
  tableFilter: "",
  actionsFilter: [],
  dateFrom: "",
  dateTo: "",
  recordIdFilter: "",
  sort: "desc",
  selectedEntry: null,
};

function ActionsFilterButton({
  value,
  onChange,
  t,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  t: ReturnType<typeof useTranslation<["admin", "common"]>>["t"];
}) {
  const [open, setOpen] = useState(false);

  function toggle(action: string) {
    onChange(value.includes(action) ? value.filter((a) => a !== action) : [...value, action]);
  }

  const label = value.length === 0 ? t("auditLogs.filters.allActions") : t("auditLogs.filters.actionsCount", { count: value.length });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "h-8 rounded-lg border bg-transparent px-2.5 text-sm transition-colors flex items-center gap-2 min-w-42.5",
          "border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-muted",
          value.length > 0 ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <span className="truncate">{label}</span>
        <HugeiconsIcon icon={ArrowDown01Icon} className={cn("size-3.5 shrink-0 ml-auto transition-transform", open && "rotate-180")} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0 max-h-96 overflow-y-auto">
        {value.length > 0 && (
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("auditLogs.filters.actionsCount", { count: value.length })}</span>
            <button type="button" onClick={() => onChange([])} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t("common:actions.clear")}
            </button>
          </div>
        )}
        {ACTION_GROUPS.map((group, i) => (
          <div key={group.label}>
            {i > 0 && <div className="h-px bg-border mx-1" />}
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</div>
            {group.actions.map((action) => {
              const checked = value.includes(action);
              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => toggle(action)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <Checkbox checked={checked} className="pointer-events-none" />
                  <span className="text-xs font-mono">{action.split(".").pop()}</span>
                  {checked && <HugeiconsIcon icon={Tick02Icon} className="size-3 text-muted-foreground ml-auto" />}
                </button>
              );
            })}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function AdminAuditLogsPage() {
  "use no memo";
  const { t, i18n } = useTranslation(["admin", "common"]);

  const [filterState, dispatchFilter] = useReducer(auditLogsFilterReducer, initialFilterState);
  const { tableFilter, actionsFilter, dateFrom, dateTo, recordIdFilter, sort, selectedEntry } = filterState;

  const { containerRef, pagination, setPagination, autoPageSize, pageSizeOptions } = useTablePagination(TABLE_PAGINATION_CONFIG);

  const resetPage = useCallback(() => setPagination((prev) => ({ ...prev, pageIndex: 0 })), [setPagination]);

  const hasActiveFilters = !!(tableFilter || actionsFilter.length || dateFrom || dateTo || recordIdFilter);
  const activeFilterCount = [tableFilter, actionsFilter.length > 0, dateFrom, dateTo, recordIdFilter].filter(Boolean).length;

  const clearAllFilters = useCallback(() => {
    dispatchFilter({ type: "CLEAR_FILTERS" });
    resetPage();
  }, [resetPage]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "audit-logs", pagination.pageIndex, pagination.pageSize, tableFilter, actionsFilter, dateFrom, dateTo, recordIdFilter, sort],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", pagination.pageSize.toString());
      params.set("offset", (pagination.pageIndex * pagination.pageSize).toString());
      params.set("sort", sort);
      if (tableFilter) params.set("table_name", tableFilter);
      if (actionsFilter.length > 0) params.set("actions", actionsFilter.join(","));
      if (recordIdFilter) params.set("record_id", recordIdFilter);
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

  const columns = useMemo(
    () => [
      columnHelper.accessor("createdAt", {
        header: () => (
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-foreground -ml-1 px-1 py-0.5 rounded transition-colors"
            onClick={() => {
              dispatchFilter({ type: "SET_SORT", payload: sort === "desc" ? "asc" : "desc" });
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
                <AvatarImage src={resolveAvatarUrl(user.image)} />
                <AvatarFallback className="text-[9px]">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="truncate max-w-28 text-xs font-medium">{user.name}</span>
                {user.username && <span className="truncate max-w-28 text-[10px] text-muted-foreground">@{user.username}</span>}
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
                "inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border",
                style.badgeClass,
              )}
            >
              <span className={cn("size-1.5 rounded-[1px]", style.dotClass)} />
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
          const shortId =
            displayId !== null
              ? String(displayId as string | number)
                  .split("-")
                  .pop()
              : null;
          return shortId !== null ? (
            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded" title={String(displayId as string | number)}>
              #{shortId}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          );
        },
      }),
      columnHelper.accessor("source", {
        header: t("auditLogs.columns.source"),
        size: 80,
        cell: ({ getValue }) => <span className="text-xs text-muted-foreground uppercase">{getValue() ?? "-"}</span>,
      }),
    ],
    [t, sort, i18n.language, resetPage],
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
            <h1 className="text-2xl font-bold tracking-tight">{t("nav:items.auditLogs")}</h1>
            <p className="text-muted-foreground text-sm">{t("auditLogs.subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={tableFilter}
            onValueChange={(v) => {
              dispatchFilter({ type: "SET_TABLE_FILTER", payload: v === "__all__" ? "" : (v as string) });
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

          <ActionsFilterButton
            t={t}
            value={actionsFilter}
            onChange={(v) => {
              dispatchFilter({ type: "SET_ACTIONS_FILTER", payload: v });
              resetPage();
            }}
          />

          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none"
            />
            <Input
              className="h-8 pl-7 w-40"
              placeholder={t("auditLogs.filters.recordId")}
              value={recordIdFilter}
              onChange={(e) => {
                dispatchFilter({ type: "SET_RECORD_ID_FILTER", payload: e.target.value });
                resetPage();
              }}
            />
          </div>

          <DatePickerButton
            value={dateFrom}
            onChange={(v) => {
              dispatchFilter({ type: "SET_DATE_FROM", payload: v });
              resetPage();
            }}
            label={t("auditLogs.filters.dateFrom")}
          />

          <DatePickerButton
            value={dateTo}
            onChange={(v) => {
              dispatchFilter({ type: "SET_DATE_TO", payload: v });
              resetPage();
            }}
            label={t("auditLogs.filters.dateTo")}
          />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
              <HugeiconsIcon icon={Cancel01Icon} className="size-3" data-icon="inline-start" />
              {t("common:actions.clearAll")}
              <span className="ml-1 bg-muted text-muted-foreground rounded-sm px-1.5 py-0.5 text-[10px] font-bold leading-none">
                {activeFilterCount}
              </span>
            </Button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn("flex-1 h-full overflow-x-auto", pagination.pageSize > autoPageSize ? "overflow-y-auto" : "overflow-y-clip")}
      >
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
              <DataTable.Body onRowClick={(row: AuditLogEntry) => dispatchFilter({ type: "SET_SELECTED_ENTRY", payload: row })} />
            )}
            <DataTable.Footer columns={columns.length}>
              <DataTablePagination table={table} totalItems={total} pageSizeOptions={pageSizeOptions} />
            </DataTable.Footer>
          </DataTable.Table>
        </DataTable.Root>
      </div>

      <AuditLogDetailSheet
        entry={selectedEntry}
        open={selectedEntry !== null}
        onOpenChange={(open) => {
          if (!open) dispatchFilter({ type: "SET_SELECTED_ENTRY", payload: null });
        }}
      />
    </div>
  );
}

export const Route = createFileRoute("/_layout/admin/_layout/audit-logs")({
  component: AdminAuditLogsPage,
  staticData: {
    titleKey: "items.auditLogs",
    i18nNamespace: "nav",
    breadcrumbs: [{ titleKey: "breadcrumbs.admin", path: "/admin/stations", i18nNamespace: "admin" }],
  },
});
