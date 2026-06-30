import { useQuery } from "@tanstack/react-query";

import { type KmzListFilters, type KmzSource, type KmzType, fetchKmzDates, fetchKmzList } from "./api";

export function useKmzList(filters: KmzListFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["kmz", filters],
    queryFn: () => fetchKmzList(filters),
    enabled: options?.enabled ?? true,
  });
}

export function useKmzDates(type: KmzType, source: KmzSource) {
  return useQuery({
    queryKey: ["kmz-dates", type, source],
    queryFn: () => fetchKmzDates(type, source),
    staleTime: 1000 * 60 * 5,
  });
}
