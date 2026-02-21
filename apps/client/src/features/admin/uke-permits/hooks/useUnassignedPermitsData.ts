import { useState, useMemo, useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { operatorsQueryOptions, regionsQueryOptions } from "@/features/shared/queries";
import { fetchUnassignedPermits } from "../api";

const STORAGE_KEY = "admin:uke-permits:filters";

export type UnassignedPermitsFilters = {
  operators: number[];
};

interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

type StoredState = {
  operators: number[];
  regions: number[];
};

function loadFromStorage(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { operators: [], regions: [] };
    const parsed = JSON.parse(raw);
    return {
      operators: Array.isArray(parsed.operators) ? parsed.operators : [],
      regions: Array.isArray(parsed.regions) ? parsed.regions : [],
    };
  } catch {
    return { operators: [], regions: [] };
  }
}

function persist(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

interface UseUnassignedPermitsDataOptions {
  pagination: PaginationState;
  setPagination: Dispatch<SetStateAction<PaginationState>>;
}

export function useUnassignedPermitsData({ pagination, setPagination }: UseUnassignedPermitsDataOptions) {
  const stored = useMemo(() => loadFromStorage(), []);

  const [filters, setFiltersRaw] = useState<UnassignedPermitsFilters>({ operators: stored.operators });
  const [selectedRegions, setSelectedRegionsRaw] = useState<number[]>(stored.regions);
  const [searchQuery, setSearchQuery] = useState("");

  const stateRef = useRef<StoredState>({ operators: stored.operators, regions: stored.regions });

  const save = useCallback((patch: Partial<StoredState>) => {
    Object.assign(stateRef.current, patch);
    persist(stateRef.current);
  }, []);

  const resetPage = useCallback(() => setPagination((prev) => ({ ...prev, pageIndex: 0 })), [setPagination]);

  const setFilters = useCallback(
    (newFilters: UnassignedPermitsFilters | ((prev: UnassignedPermitsFilters) => UnassignedPermitsFilters)) => {
      setFiltersRaw((prev) => {
        const resolved = typeof newFilters === "function" ? newFilters(prev) : newFilters;
        save({ operators: resolved.operators });
        return resolved;
      });
      resetPage();
    },
    [save, resetPage],
  );

  const setSelectedRegions = useCallback(
    (value: number[] | ((prev: number[]) => number[])) => {
      setSelectedRegionsRaw((prev) => {
        const resolved = typeof value === "function" ? value(prev) : value;
        save({ regions: resolved });
        return resolved;
      });
      resetPage();
    },
    [save, resetPage],
  );

  const clearAllFilters = useCallback(() => {
    setFiltersRaw({ operators: [] });
    setSelectedRegionsRaw([]);
    save({ operators: [], regions: [] });
    resetPage();
  }, [save, resetPage]);

  const { data: operators = [] } = useQuery(operatorsQueryOptions());
  const { data: regions = [] } = useQuery(regionsQueryOptions());

  const selectedRegionCodes = useMemo(() => {
    return selectedRegions.map((id) => regions.find((r) => r.id === id)?.code).filter((code): code is string => Boolean(code));
  }, [selectedRegions, regions]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-unassigned-permits", pagination.pageIndex, pagination.pageSize, filters.operators, selectedRegionCodes],
    queryFn: () =>
      fetchUnassignedPermits({
        page: pagination.pageIndex + 1,
        limit: Math.max(pagination.pageSize, 25),
        regions: selectedRegionCodes.length ? selectedRegionCodes.join(",") : undefined,
        operators: filters.operators.length ? filters.operators.join(",") : undefined,
      }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: "always",
  });

  const stations = useMemo(() => {
    const all = data?.data ?? [];
    if (!searchQuery.trim()) return all;
    const q = searchQuery.toLowerCase();
    return all.filter(
      (s) =>
        s.station_id.toLowerCase().includes(q) ||
        s.operator?.name.toLowerCase().includes(q) ||
        s.location?.city?.toLowerCase().includes(q) ||
        s.location?.address?.toLowerCase().includes(q),
    );
  }, [data, searchQuery]);

  const totalStations = data?.totalCount ?? 0;
  const activeFilterCount = filters.operators.length + selectedRegions.length;

  return {
    stations,
    operators,
    regions,
    totalStations,
    filters,
    setFilters,
    selectedRegions,
    setSelectedRegions,
    clearAllFilters,
    activeFilterCount,
    searchQuery,
    setSearchQuery,
    isLoading,
    isFetching,
  };
}
