import {
  fetchAnalyzerUsage,
  fetchPermitSnapshot,
  fetchStatsCompleteness,
  fetchStatsHistory,
  fetchStatsPermits,
  fetchStatsStationsHistory,
  fetchStatsSummary,
  fetchStatsVoivodeships,
} from "./api";

export function statsSummaryQueryOptions(operatorId?: number) {
  return {
    queryKey: ["stats", "summary", operatorId] as const,
    queryFn: () => fetchStatsSummary(operatorId),
    staleTime: 1000 * 60 * 5,
  };
}

export function statsPermitsQueryOptions(operatorId?: number) {
  return {
    queryKey: ["stats", "permits", operatorId] as const,
    queryFn: () => fetchStatsPermits(operatorId),
    staleTime: 1000 * 60 * 5,
  };
}

export function statsHistoryQueryOptions(params?: { operator_id?: number; band_id?: number; from?: string; to?: string; granularity?: string }) {
  return {
    queryKey: ["stats", "history", params] as const,
    queryFn: () => fetchStatsHistory(params),
    staleTime: 1000 * 60 * 5,
  };
}

export function statsStationsHistoryQueryOptions(params?: { operator_id?: number; from?: string; to?: string; granularity?: string }) {
  return {
    queryKey: ["stats", "stations-history", params] as const,
    queryFn: () => fetchStatsStationsHistory(params),
    staleTime: 1000 * 60 * 5,
  };
}

export function statsVoivodeshipsQueryOptions(operatorId?: number) {
  return {
    queryKey: ["stats", "voivodeships", operatorId] as const,
    queryFn: () => fetchStatsVoivodeships(operatorId),
    staleTime: 1000 * 60 * 5,
  };
}

export function statsCompletenessQueryOptions() {
  return {
    queryKey: ["stats", "completeness"] as const,
    queryFn: () => fetchStatsCompleteness,
    staleTime: 1000 * 60 * 5,
  };
}

export function analyzerUsageQueryOptions(params?: { from?: string; to?: string; granularity?: "daily" | "monthly" }) {
  return {
    queryKey: ["stats", "analyzer-usage", params] as const,
    queryFn: () => fetchAnalyzerUsage(params),
    staleTime: 1000 * 60 * 5,
  };
}

export function permitSnapshotQueryOptions(month: string) {
  return {
    queryKey: ["stats", "permit-snapshot", month] as const,
    queryFn: () => fetchPermitSnapshot(month),
    staleTime: 1000 * 60 * 5,
  };
}
