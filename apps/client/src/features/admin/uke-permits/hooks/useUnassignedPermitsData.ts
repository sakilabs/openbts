import { useState, useMemo, useCallback, useRef } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { operatorsQueryOptions, regionsQueryOptions } from "@/features/shared/queries";
import { fetchUnassignedPermits } from "../api";

const FETCH_LIMIT = 100;
const STORAGE_KEY = "admin:uke-permits:filters";

export type UnassignedPermitsFilters = {
  operators: number[];
};

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

export function useUnassignedPermitsData() {
  const stored = useMemo(() => loadFromStorage(), []);

  const [filters, setFiltersRaw] = useState<UnassignedPermitsFilters>({ operators: stored.operators });
  const [selectedRegions, setSelectedRegionsRaw] = useState<number[]>(stored.regions);
  const [searchQuery, setSearchQuery] = useState("");

  const stateRef = useRef<StoredState>({ operators: stored.operators, regions: stored.regions });

  const save = useCallback((patch: Partial<StoredState>) => {
    Object.assign(stateRef.current, patch);
    persist(stateRef.current);
  }, []);

  const setFilters = useCallback(
    (newFilters: UnassignedPermitsFilters | ((prev: UnassignedPermitsFilters) => UnassignedPermitsFilters)) => {
      setFiltersRaw((prev) => {
        const resolved = typeof newFilters === "function" ? newFilters(prev) : newFilters;
        save({ operators: resolved.operators });
        return resolved;
      });
    },
    [save],
  );

  const setSelectedRegions = useCallback(
    (value: number[] | ((prev: number[]) => number[])) => {
      setSelectedRegionsRaw((prev) => {
        const resolved = typeof value === "function" ? value(prev) : value;
        save({ regions: resolved });
        return resolved;
      });
    },
    [save],
  );

  const clearAllFilters = useCallback(() => {
    setFiltersRaw({ operators: [] });
    setSelectedRegionsRaw([]);
    save({ operators: [], regions: [] });
  }, [save]);

  const { data: operators = [] } = useQuery(operatorsQueryOptions());
  const { data: regions = [] } = useQuery(regionsQueryOptions());

  const selectedRegionCodes = useMemo(() => {
    return selectedRegions.map((id) => regions.find((r) => r.id === id)?.code).filter((code): code is string => Boolean(code));
  }, [selectedRegions, regions]);

  const { data, fetchNextPage, hasNextPage, isLoading, isFetching } = useInfiniteQuery({
    queryKey: ["admin-unassigned-permits", FETCH_LIMIT, filters.operators, selectedRegionCodes],
    queryFn: ({ pageParam }) =>
      fetchUnassignedPermits({
        page: pageParam,
        limit: FETCH_LIMIT,
        regions: selectedRegionCodes.length ? selectedRegionCodes.join(",") : undefined,
        operators: filters.operators.length ? filters.operators.join(",") : undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.data.length === FETCH_LIMIT ? allPages.length + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnMount: "always",
  });

  const allStations = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const stations = useMemo(() => {
    if (!searchQuery.trim()) return allStations;
    const q = searchQuery.toLowerCase();
    return allStations.filter(
      (s) =>
        s.station_id.toLowerCase().includes(q) ||
        s.operator?.name.toLowerCase().includes(q) ||
        s.location?.city?.toLowerCase().includes(q) ||
        s.location?.address?.toLowerCase().includes(q),
    );
  }, [allStations, searchQuery]);

  const totalStations = useMemo(() => {
    if (!data?.pages.length) return undefined;
    return data.pages[data.pages.length - 1]?.totalCount;
  }, [data]);

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
    hasMore: hasNextPage,
    loadMore: hasNextPage ? fetchNextPage : undefined,
  };
}
