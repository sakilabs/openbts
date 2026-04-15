import {
  AlertCircleIcon,
  ArrowRight01Icon,
  Cancel01Icon,
  File02Icon,
  Location01Icon,
  Sorting05Icon,
  Tag01Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  type SortingState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Suspense, lazy, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { RequireAuth } from "@/components/auth/requireAuth";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RAT_ICONS } from "@/features/shared/rat";
import { type FileFormat, type ParsedRow, detectFormat, parseFile } from "@/lib/analyzer-parsers";
import { postApiData, showApiError } from "@/lib/api";
import { getOperatorColor } from "@/lib/operatorUtils";
import type { Operator, Region } from "@/types/station";
const StationDetailsDialog = lazy(() =>
  import("@/features/station-details/components/stationsDetailsDialog").then((m) => ({ default: m.StationDetailsDialog })),
);
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";
import { useIsMobile } from "@/hooks/useMobile";
import { useTablePagination } from "@/hooks/useTablePageSize";
import { getBandFromEarfcn, getBandFromUarfcn, getBandMhz } from "@/lib/band-utils";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

type AnalyzerLocation = {
  id: number;
  city: string | null;
  address: string | null;
  longitude: number;
  latitude: number;
  updatedAt: string;
  createdAt: string;
  region: Region | null;
};

type AnalyzerStation = {
  id: number;
  station_id: string;
  notes: string | null;
  extra_address: string | null;
  updatedAt: string;
  createdAt: string;
  is_confirmed: boolean | null;
  operator: Operator;
  location: AnalyzerLocation;
};

type MatchedCell =
  | { rat: "GSM"; lac: number; cid: number }
  | { rat: "UMTS"; rnc: number; cid: number; lac: number | null; arfcn: number | null }
  | { rat: "LTE"; enbid: number; clid: number | null; tac: number | null; pci: number | null; earfcn: number | null }
  | { rat: "NR" };

type AnalyzerResult = {
  status: "found" | "probable" | "not_found" | "unsupported";
  station?: AnalyzerStation;
  cell?: MatchedCell;
  warnings: string[];
};

type AnalyzerRow = {
  parsedRow: ParsedRow;
  index: number;
  result?: AnalyzerResult;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_CELLS = 20_000;

const MNC_NAMES: Record<number, string> = {
  26001: "Plus",
  26002: "T-Mobile",
  26003: "Orange",
  26006: "Play",
  26034: "NetWorks",
};

const MISMATCH_WARNINGS = new Set([
  "lac_mismatch",
  "tac_mismatch",
  "pci_mismatch",
  "pci_missing",
  "rnc_mismatch",
  "uarfcn_mismatch",
  "earfcn_mismatch",
]);

const WARNING_FILTER_ALIASES: Partial<Record<string, string[]>> = {
  pci_mismatch: ["pci_mismatch", "pci_missing"],
};

const WARNING_I18N_KEY: Record<string, string> = {
  enbid_only: "warning.enbidOnly",
};

const SORT_ASC_STYLE = { transform: "scaleY(-1)" };

const RAT_BADGE_CLASS: Record<string, string> = {
  GSM: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  UMTS: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  LTE: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  NR: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

const TABLE_PAGINATION_CONFIG = { rowHeight: 60, headerHeight: 40, paginationHeight: 45 };

const columnHelper = createColumnHelper<AnalyzerRow>();

function rowBg(result?: AnalyzerResult): string {
  if (!result) return "hover:bg-muted/50";
  if (result.status === "not_found") return "bg-destructive/5 hover:bg-destructive/10";
  if (result.status === "probable") return "bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20";
  if (result.status === "found" && result.warnings.length > 0) return "bg-amber-50/40 dark:bg-amber-900/5";
  return "hover:bg-muted/50";
}

type AnalyzerState = {
  isDragging: boolean;
  parsedRows: ParsedRow[] | null;
  results: AnalyzerResult[] | null;
  fileName: string | null;
  fileSize: number;
  fileFormat: FileFormat | null;
  statusFilter: string;
  ratFilter: string;
  warningFilter: string;
  operatorFilter: string;
};

type AnalyzerAction =
  | { type: "SET_DRAGGING"; payload: boolean }
  | { type: "SET_FILE"; payload: { name: string; size: number } }
  | { type: "SET_PARSED"; payload: { rows: ParsedRow[]; format: FileFormat } | null }
  | { type: "SET_RESULTS"; payload: AnalyzerResult[] }
  | { type: "SET_STATUS_FILTER"; payload: string | null }
  | { type: "SET_RAT_FILTER"; payload: string | null }
  | { type: "SET_WARNING_FILTER"; payload: string | null }
  | { type: "SET_OPERATOR_FILTER"; payload: string | null }
  | { type: "CLEAR_FILTERS" };

const initialState: AnalyzerState = {
  isDragging: false,
  parsedRows: null,
  results: null,
  fileName: null,
  fileSize: 0,
  fileFormat: null,
  statusFilter: "all",
  ratFilter: "all",
  warningFilter: "all",
  operatorFilter: "all",
};

function analyzerReducer(state: AnalyzerState, action: AnalyzerAction): AnalyzerState {
  switch (action.type) {
    case "SET_DRAGGING":
      return { ...state, isDragging: action.payload };
    case "SET_FILE":
      return { ...state, fileName: action.payload.name, fileSize: action.payload.size, results: null };
    case "SET_PARSED":
      return action.payload
        ? { ...state, parsedRows: action.payload.rows, fileFormat: action.payload.format }
        : { ...state, parsedRows: null, fileFormat: null };
    case "SET_RESULTS":
      return { ...state, results: action.payload };
    case "SET_STATUS_FILTER":
      return { ...state, statusFilter: action.payload ?? "all" };
    case "SET_RAT_FILTER":
      return { ...state, ratFilter: action.payload ?? "all" };
    case "SET_WARNING_FILTER":
      return { ...state, warningFilter: action.payload ?? "all" };
    case "SET_OPERATOR_FILTER":
      return { ...state, operatorFilter: action.payload ?? "all" };
    case "CLEAR_FILTERS":
      return { ...state, statusFilter: "all", ratFilter: "all", warningFilter: "all", operatorFilter: "all" };
  }
}

function AnalyzerPage() {
  const { t } = useTranslation(["cellAnalyzer", "common"]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, dispatch] = useReducer(analyzerReducer, initialState);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const analyzeStartRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [finalDuration, setFinalDuration] = useState<number | null>(null);
  const { isDragging, parsedRows, results, fileName, fileSize, fileFormat, statusFilter, ratFilter, warningFilter, operatorFilter } = state;
  const isMobile = useIsMobile();
  const scrollRef = useHorizontalScroll<HTMLDivElement>();
  const { containerRef, pagination, setPagination, pageSizeOptions } = useTablePagination(TABLE_PAGINATION_CONFIG);

  const MOBILE_PAGE_SIZE = 13;
  const effectivePagination = isMobile ? { ...pagination, pageSize: MOBILE_PAGE_SIZE } : pagination;

  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef(node);
      containerRef(node);
    },
    [containerRef, scrollRef],
  );

  const resetPage = useCallback(() => setPagination((p) => ({ ...p, pageIndex: 0 })), [setPagination]);

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(t("errors.fileTooLarge"));
        return;
      }

      dispatch({ type: "SET_FILE", payload: { name: file.name, size: file.size } });

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const format = detectFormat(file.name, text);
        const rows = parseFile(format, text);
        if (rows.length === 0) {
          toast.error(t("errors.noValidRows"));
          dispatch({ type: "SET_PARSED", payload: null });
          return;
        }
        const truncated = rows.slice(0, MAX_CELLS);
        if (rows.length > MAX_CELLS) {
          toast.warning(t("errors.truncated", { count: MAX_CELLS }));
        }
        dispatch({ type: "SET_PARSED", payload: { rows: truncated, format } });
        resetPage();
      };
      reader.readAsText(file, "utf-8");
    },
    [t, resetPage],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dispatch({ type: "SET_DRAGGING", payload: false });
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const parsedRowsRef = useRef(parsedRows);
  parsedRowsRef.current = parsedRows;

  const mutationFn = useCallback(async () => {
    const cells = parsedRowsRef.current!.map(({ description: _d, rawLine: _r, ...cell }) => cell);
    return postApiData<AnalyzerResult[], { cells: typeof cells }>("analyzer", { cells });
  }, []);

  const onAnalyzeSuccess = useCallback(
    (data: AnalyzerResult[]) => {
      if (analyzeStartRef.current) setFinalDuration(Date.now() - analyzeStartRef.current);
      dispatch({ type: "SET_RESULTS", payload: data });
      resetPage();
    },
    [resetPage],
  );

  const { mutate: handleAnalyze, isPending: isLoading } = useMutation({
    mutationFn,
    onMutate: () => {
      analyzeStartRef.current = Date.now();
      setElapsed(0);
      setFinalDuration(null);
    },
    onSuccess: onAnalyzeSuccess,
    onError: showApiError,
  });

  useEffect(() => {
    if (!isLoading) return;
    const id = setInterval(() => {
      if (analyzeStartRef.current) setElapsed(Date.now() - analyzeStartRef.current);
    }, 500);
    return () => clearInterval(id);
  }, [isLoading]);

  const stats = useMemo(() => {
    if (!results) return null;
    let found = 0,
      probable = 0,
      notFound = 0,
      unsupported = 0;
    for (const r of results) {
      if (r.status === "found") found++;
      else if (r.status === "probable") probable++;
      else if (r.status === "not_found") notFound++;
      else unsupported++;
    }
    return { found, probable, notFound, unsupported };
  }, [results]);

  const warningLabels = useMemo(
    () => ({
      all: t("common:status.all"),
      any: t("filter.anyWarning"),
      lac_mismatch: "LAC · GSM/UMTS",
      tac_mismatch: "TAC · LTE",
      pci_mismatch: "PCI · LTE",
      pci_missing: t("warning.pciMissing"),
      rnc_mismatch: "RNC · UMTS",
      uarfcn_mismatch: "UARFCN · UMTS",
      earfcn_mismatch: "EARFCN · LTE",
      enbid_only: t("warning.enbidOnly"),
      mismatchGroup: t("filter.mismatchGroup"),
      otherGroup: t("filter.otherGroup"),
    }),
    [t],
  );

  const hasActiveFilters = statusFilter !== "all" || ratFilter !== "all" || warningFilter !== "all" || operatorFilter !== "all";

  const statusLabels = useMemo(
    () => ({
      all: t("common:status.all"),
      found: t("status.found"),
      probable: t("status.probable"),
      not_found: t("status.notFound"),
      unsupported: t("status.unsupported"),
    }),
    [t],
  );

  const ratLabels = useMemo(
    () => ({
      all: t("common:status.all"),
      GSM: "GSM",
      UMTS: "UMTS",
      LTE: "LTE",
      NR: "NR",
    }),
    [t],
  );

  const availableMncs = useMemo(() => {
    if (!parsedRows) return [];
    const seen = new Set<number>();
    for (const row of parsedRows) seen.add(row.mnc);
    return [...seen].sort((a, b) => {
      const nameA = MNC_NAMES[a] ?? String(a);
      const nameB = MNC_NAMES[b] ?? String(b);
      return nameA.localeCompare(nameB);
    });
  }, [parsedRows]);

  const tableData = useMemo<AnalyzerRow[]>(() => {
    if (!parsedRows) return [];
    return parsedRows.reduce<AnalyzerRow[]>((acc, row, index) => {
      if (ratFilter !== "all" && row.rat !== ratFilter) return acc;
      if (operatorFilter !== "all" && String(row.mnc) !== operatorFilter) return acc;
      const result = results?.[index];
      if (statusFilter !== "all" && results) {
        if (!result || result.status !== statusFilter) return acc;
      }
      if (warningFilter !== "all" && results) {
        if (!result) return acc;
        if (warningFilter === "any") {
          if (result.warnings.length === 0) return acc;
        } else {
          const matches = WARNING_FILTER_ALIASES[warningFilter] ?? [warningFilter];
          if (!matches.some((w) => result.warnings.includes(w))) return acc;
        }
      }

      acc.push({ parsedRow: row, index, result });
      return acc;
    }, []);
  }, [parsedRows, results, statusFilter, ratFilter, warningFilter, operatorFilter]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "num",
        header: "#",
        size: 40,
        cell: ({ row }) => <span className="text-muted-foreground text-xs tabular-nums">{row.original.index + 1}</span>,
      }),
      columnHelper.accessor((r) => r.parsedRow.rat, {
        id: "rat",
        header: "Standard",
        size: 80,
        cell: ({ getValue }) => {
          const rat = getValue();
          return (
            <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold", RAT_BADGE_CLASS[rat])}>
              <HugeiconsIcon icon={RAT_ICONS[rat]} className="size-3" />
              {rat}
            </span>
          );
        },
      }),
      columnHelper.accessor((r) => r.parsedRow, {
        id: "band",
        header: t("common:labels.band"),
        size: 90,
        cell: ({ getValue }) => {
          const row = getValue();
          let band: number | null = null;
          if (row.rat === "LTE" && row.earfcn !== undefined) band = getBandFromEarfcn(row.earfcn);
          else if (row.rat === "UMTS" && row.uarfcn !== undefined) band = getBandFromUarfcn(row.uarfcn);
          if (band === null) return <span className="text-muted-foreground text-xs">-</span>;
          const mhz = getBandMhz(band);
          return (
            <span className="text-xs font-mono">
              {mhz && <span className="font-semibold">{mhz}</span>}
              <span className="opacity-75">
                {mhz ? " " : ""}(B{band})
              </span>
            </span>
          );
        },
      }),
      columnHelper.accessor((r) => r.parsedRow, {
        id: "operator",
        header: t("common:labels.operator"),
        size: 140,
        cell: ({ getValue }) => {
          const row = getValue();
          const name = MNC_NAMES[row.mnc];
          const color = getOperatorColor(row.mnc);
          return (
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-[2px] shrink-0" style={{ backgroundColor: color }} />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium leading-tight">{name ?? row.mnc}</span>
                {name && <span className="font-mono text-[10px] text-muted-foreground leading-tight">({row.mnc})</span>}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor((r) => r.parsedRow, {
        id: "identifiers",
        header: ({ column }) => {
          const sorted = column.getIsSorted();
          return (
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-foreground -ml-1 px-1 py-0.5 rounded transition-colors"
              onClick={column.getToggleSortingHandler()}
            >
              {t("table.identifiers")}
              <HugeiconsIcon
                icon={Sorting05Icon}
                className={cn("size-3.5 transition-colors", sorted ? "text-foreground" : "text-muted-foreground/40")}
                style={sorted === "asc" ? SORT_ASC_STYLE : undefined}
              />
            </button>
          );
        },
        size: 180,
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.parsedRow;
          const b = rowB.original.parsedRow;
          if (a.rat === "LTE" && b.rat === "LTE") return a.enbid - b.enbid;
          if (a.rat === "GSM" && b.rat === "GSM") {
            const lacDiff = a.lac - b.lac;
            return lacDiff !== 0 ? lacDiff : a.cid - b.cid;
          }
          if (a.rat === "UMTS" && b.rat === "UMTS") {
            const lacDiff = a.lac - b.lac;
            return lacDiff !== 0 ? lacDiff : (a.rnc ?? 0) - (b.rnc ?? 0);
          }
          return 0;
        },
        cell: ({ getValue, row }) => {
          const cell = getValue();
          const warnings = row.original.result?.warnings ?? [];

          const matched = row.original.result?.cell;

          const ids: { label: string; value: number | null; dbValue?: number | null; warn?: boolean; missing?: boolean }[] = (() => {
            switch (cell.rat) {
              case "GSM":
                return [
                  { label: "LAC", value: cell.lac, dbValue: matched?.rat === "GSM" ? matched.lac : null, warn: warnings.includes("lac_mismatch") },
                  { label: "CID", value: cell.cid },
                ];
              case "UMTS":
                return [
                  { label: "RNC", value: cell.rnc, dbValue: matched?.rat === "UMTS" ? matched.rnc : null, warn: warnings.includes("rnc_mismatch") },
                  { label: "LAC", value: cell.lac, dbValue: matched?.rat === "UMTS" ? matched.lac : null, warn: warnings.includes("lac_mismatch") },
                  { label: "CID", value: cell.cid },
                  ...(cell.uarfcn !== undefined
                    ? [
                        {
                          label: "UARFCN",
                          value: cell.uarfcn,
                          dbValue: matched?.rat === "UMTS" ? matched.arfcn : null,
                          warn: warnings.includes("uarfcn_mismatch"),
                        },
                      ]
                    : []),
                ];
              case "LTE":
                return [
                  { label: "eNBID", value: cell.enbid },
                  { label: "CLID", value: cell.clid },
                  { label: "TAC", value: cell.tac, dbValue: matched?.rat === "LTE" ? matched.tac : null, warn: warnings.includes("tac_mismatch") },
                  {
                    label: "PCI",
                    value: cell.pci,
                    dbValue: matched?.rat === "LTE" ? matched.pci : null,
                    warn: warnings.includes("pci_mismatch"),
                    missing: warnings.includes("pci_missing"),
                  },
                  ...(cell.earfcn !== undefined
                    ? [
                        {
                          label: "EARFCN",
                          value: cell.earfcn,
                          dbValue: matched?.rat === "LTE" ? matched.earfcn : null,
                          warn: warnings.includes("earfcn_mismatch"),
                        },
                      ]
                    : []),
                ];
              case "NR":
                return cell.arfcn !== undefined ? [{ label: "ARFCN", value: cell.arfcn }] : [];
            }
          })();

          const extraWarnings = warnings.filter((w) => !MISMATCH_WARNINGS.has(w));

          if (ids.length === 0 && extraWarnings.length === 0) return <span className="text-muted-foreground text-xs">-</span>;

          return (
            <div className="flex flex-wrap items-center gap-1">
              {ids.map(({ label, value, dbValue, warn, missing }) => {
                let stateClass = "bg-muted px-1.5 py-0.5 text-muted-foreground";
                if (warn) stateClass = "bg-destructive/10 text-destructive px-1.5 py-0.5";
                else if (missing) stateClass = "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200 px-1.5 py-0.5";
                return (
                  <span key={label} className={cn("inline-flex items-center rounded-md text-[11px] font-medium", stateClass)}>
                    <span className="mr-0.5 opacity-60">{label}</span>
                    {warn && dbValue !== null && dbValue !== undefined && (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="inline-flex items-center">
                            <span className="font-mono font-semibold underline decoration-dotted">{dbValue}</span>
                            <HugeiconsIcon icon={ArrowRight01Icon} className="mx-0.5 size-3 opacity-50" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{t("warning.dbValue")}</TooltipContent>
                      </Tooltip>
                    )}
                    {missing ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="font-mono font-semibold underline decoration-dotted cursor-help">{value}</span>
                        </TooltipTrigger>
                        <TooltipContent>{t("warning.pciMissingFromDb")}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="font-mono font-semibold">{value}</span>
                    )}
                  </span>
                );
              })}
              {extraWarnings.map((w) => (
                <span
                  key={w}
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400"
                >
                  <HugeiconsIcon icon={AlertCircleIcon} className="size-3 shrink-0" />
                  {t(WARNING_I18N_KEY[w] ?? w)}
                </span>
              ))}
            </div>
          );
        },
      }),
      columnHelper.accessor((r) => r.parsedRow.description, {
        id: "description",
        header: t("table.description"),
        size: 260,
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground line-clamp-2" title={getValue()}>
            {getValue() || "-"}
          </span>
        ),
      }),
      columnHelper.accessor((r) => r.result, {
        id: "location",
        header: t("table.location"),
        size: 240,
        cell: ({ getValue }) => {
          const result = getValue();
          if (!result) return <span className="text-muted-foreground text-xs">-</span>;
          if (result.status === "unsupported") return <span className="text-muted-foreground text-xs italic">{t("status.unsupported")}</span>;
          if (result.status === "not_found") return <span className="text-destructive font-semibold text-sm">{t("status.notFound")}</span>;

          const loc = result.station?.location;
          const locationText = loc?.city || loc?.address ? [loc.city, loc.address].filter(Boolean).join(", ") : "-";
          const regionText = loc?.region?.name;

          return (
            <div className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">
              {locationText}
              {regionText && <span className="text-muted-foreground font-normal text-xs"> · {regionText}</span>}
            </div>
          );
        },
      }),
      columnHelper.accessor((r) => r.result, {
        id: "station",
        header: t("common:labels.station"),
        size: 160,
        cell: ({ getValue }) => {
          const result = getValue();
          const station = result?.station;
          if (!station) return <span className="text-muted-foreground text-xs">-</span>;
          return (
            <div className="flex items-center gap-1.5 flex-nowrap">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                onClick={() => setSelectedStationId(station.id)}
              >
                <HugeiconsIcon icon={Tag01Icon} className="size-3 shrink-0" />
                <span className="font-mono">{station.station_id}</span>
              </button>
              {station.location && (
                <Link
                  to="/"
                  hash={`map=16/${station.location.latitude}/${station.location.longitude}~f~L${station.location.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HugeiconsIcon icon={Location01Icon} className="size-3 shrink-0" />
                  <span className="font-mono">{station.location.id}</span>
                </Link>
              )}
              {result?.status === "probable" && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {t("status.probable")}
                </span>
              )}
            </div>
          );
        },
      }),
    ],
    [t],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination: effectivePagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  });

  return (
    <RequireAuth>
      <div className={cn("flex-1 p-4", isMobile ? "overflow-y-auto space-y-4" : "flex flex-col gap-4 min-h-0 overflow-hidden")}>
        <div className="flex flex-col gap-4 shrink-0">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{t("nav:items.analyzer")}</h1>
            <p className="text-muted-foreground text-sm">{t("page.description")}</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".ntm,.csv,.txt,.clf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />

          {parsedRows ? (
            <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
              <HugeiconsIcon icon={File02Icon} className="size-5 text-muted-foreground shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{fileName}</span>
                <span className="text-xs text-muted-foreground">
                  {t("file.rowCount", { count: parsedRows.length })} · {formatFileSize(fileSize)} ·{" "}
                  {fileFormat === "netmonitor" ? "NetMonitor" : "NetMonster"}
                </span>
              </div>
              <Button variant="outline" size="sm" className="ml-auto shrink-0" onClick={() => fileInputRef.current?.click()}>
                {t("file.changeFile")}
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:border-primary/60 hover:bg-primary/5",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                dispatch({ type: "SET_DRAGGING", payload: true });
              }}
              onDragLeave={() => dispatch({ type: "SET_DRAGGING", payload: false })}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
            >
              <HugeiconsIcon icon={Upload04Icon} className="size-10 mx-auto mb-3 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium">{t("file.dropHint")}</p>
                <p className="text-sm text-muted-foreground">{t("file.constraints")}</p>
              </div>
            </div>
          )}

          {parsedRows && (
            <div className="flex items-center gap-4 flex-wrap">
              <Button onClick={() => handleAnalyze()} disabled={isLoading || !parsedRows?.length} size="lg">
                {isLoading ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    {t("button.analyzing")}
                    <span className="opacity-70 text-xs tabular-nums">{formatDuration(elapsed)}</span>
                  </>
                ) : (
                  t("button.analyze", { count: parsedRows.length })
                )}
              </Button>

              {stats && (
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <span className="size-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    {stats.found} {t("stats.found")}
                  </span>
                  {stats.probable > 0 && (
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <span className="size-2 rounded-full bg-amber-600 dark:bg-amber-400" />
                      {stats.probable} {t("stats.probable")}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-destructive">
                    <span className="size-2 rounded-full bg-destructive" />
                    {stats.notFound} {t("stats.notFound")}
                  </span>
                  {stats.unsupported > 0 && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="size-2 rounded-full bg-muted-foreground" />
                      {stats.unsupported} {t("stats.unsupported")}
                    </span>
                  )}
                  {finalDuration !== null ? <span className="text-muted-foreground tabular-nums">{formatDuration(finalDuration)}</span> : null}
                </div>
              )}
            </div>
          )}
        </div>

        {parsedRows && (
          <div className="flex flex-wrap items-end gap-2 shrink-0">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground px-0.5">{t("filter.status")}</span>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  dispatch({ type: "SET_STATUS_FILTER", payload: v });
                  resetPage();
                }}
                disabled={!results}
              >
                <SelectTrigger className="min-w-40">
                  <SelectValue>{statusLabels[statusFilter as keyof typeof statusLabels] ?? statusFilter}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common:status.all")}</SelectItem>
                  <SelectItem value="found">{t("status.found")}</SelectItem>
                  <SelectItem value="probable">{t("status.probable")}</SelectItem>
                  <SelectItem value="not_found">{t("status.notFound")}</SelectItem>
                  <SelectItem value="unsupported">{t("status.unsupported")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground px-0.5">Standard</span>
              <Select
                value={ratFilter}
                onValueChange={(v) => {
                  dispatch({ type: "SET_RAT_FILTER", payload: v });
                  resetPage();
                }}
              >
                <SelectTrigger className="min-w-32">
                  <SelectValue>{ratLabels[ratFilter as keyof typeof ratLabels] ?? ratFilter}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common:status.all")}</SelectItem>
                  <SelectItem value="GSM">GSM</SelectItem>
                  <SelectItem value="UMTS">UMTS</SelectItem>
                  <SelectItem value="LTE">LTE</SelectItem>
                  <SelectItem value="NR">NR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground px-0.5">Operator</span>
              <Select
                value={operatorFilter}
                onValueChange={(v) => {
                  dispatch({ type: "SET_OPERATOR_FILTER", payload: v });
                  resetPage();
                }}
                disabled={availableMncs.length <= 1}
              >
                <SelectTrigger className="min-w-36">
                  <SelectValue>
                    {operatorFilter === "all" ? t("common:status.all") : (MNC_NAMES[Number(operatorFilter)] ?? operatorFilter)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common:status.all")}</SelectItem>
                  {availableMncs.map((mnc) => (
                    <SelectItem key={mnc} value={String(mnc)}>
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-[2px] shrink-0" style={{ backgroundColor: getOperatorColor(mnc) }} />
                        {MNC_NAMES[mnc] ?? mnc}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground px-0.5">{t("filter.warning")}</span>
              <Select
                value={warningFilter}
                onValueChange={(v) => {
                  dispatch({ type: "SET_WARNING_FILTER", payload: v });
                  resetPage();
                }}
                disabled={!results}
              >
                <SelectTrigger className="min-w-40">
                  <SelectValue>{warningLabels[warningFilter as keyof typeof warningLabels] ?? warningFilter}</SelectValue>
                </SelectTrigger>
                <SelectContent className="min-w-56">
                  <SelectItem value="all">{t("common:status.all")}</SelectItem>
                  <SelectItem value="any">{t("filter.anyWarning")}</SelectItem>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>{warningLabels.mismatchGroup}</SelectLabel>
                    <SelectItem value="lac_mismatch">{warningLabels.lac_mismatch}</SelectItem>
                    <SelectItem value="tac_mismatch">{warningLabels.tac_mismatch}</SelectItem>
                    <SelectItem value="rnc_mismatch">{warningLabels.rnc_mismatch}</SelectItem>
                    <SelectItem value="pci_mismatch">{warningLabels.pci_mismatch}</SelectItem>
                    <SelectItem value="uarfcn_mismatch">{warningLabels.uarfcn_mismatch}</SelectItem>
                    <SelectItem value="earfcn_mismatch">{warningLabels.earfcn_mismatch}</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>{warningLabels.otherGroup}</SelectLabel>
                    <SelectItem value="pci_missing">{warningLabels.pci_missing}</SelectItem>
                    <SelectItem value="enbid_only">{warningLabels.enbid_only}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  dispatch({ type: "CLEAR_FILTERS" });
                  resetPage();
                }}
                className="text-muted-foreground"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-3" data-icon="inline-start" />
                {t("common:actions.clear")}
              </Button>
            )}
          </div>
        )}

        <div
          ref={isMobile ? undefined : mergedRef}
          className={cn(
            "transition-opacity",
            !isMobile && "flex-1 min-h-0 overflow-auto",
            isMobile && "overflow-x-auto",
            !parsedRows && "hidden",
            isLoading && "opacity-50 pointer-events-none",
          )}
        >
          <DataTable.Root table={table}>
            <DataTable.Table className="w-max min-w-full">
              <DataTable.Header />
              <tbody className="[&_tr:last-child]:border-0">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className={cn("h-15 border-b transition-colors", rowBg(row.original.result))}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-2 py-1 align-middle overflow-hidden" style={{ width: cell.column.getSize() }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <DataTable.Footer columns={columns.length}>
                <DataTablePagination table={table} totalItems={tableData.length} pageSizeOptions={pageSizeOptions} />
              </DataTable.Footer>
            </DataTable.Table>
          </DataTable.Root>
        </div>
      </div>
      <Suspense fallback={null}>
        <StationDetailsDialog key={selectedStationId} stationId={selectedStationId} source="internal" onClose={() => setSelectedStationId(null)} />
      </Suspense>
    </RequireAuth>
  );
}

export const Route = createFileRoute("/_layout/analyzer")({
  component: AnalyzerPage,
  staticData: {
    titleKey: "items.analyzer",
    i18nNamespace: "nav",
    breadcrumbs: [{ titleKey: "sections.stations", i18nNamespace: "nav", path: "/" }],
  },
});
