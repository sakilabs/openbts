import { fetchOperators, fetchBands, fetchRegions } from "./api";

export function operatorsQueryOptions() {
  return {
    queryKey: ["operators"] as const,
    queryFn: fetchOperators,
    staleTime: 1000 * 60 * 30,
  };
}

export function bandsQueryOptions() {
  return {
    queryKey: ["bands"] as const,
    queryFn: fetchBands,
    staleTime: 1000 * 60 * 30,
  };
}

export function regionsQueryOptions() {
  return {
    queryKey: ["regions"] as const,
    queryFn: fetchRegions,
    staleTime: 1000 * 60 * 30,
  };
}
