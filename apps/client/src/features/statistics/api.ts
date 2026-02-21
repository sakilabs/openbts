import { fetchApiData } from "@/lib/api";

export interface InternalSummary {
  total_stations: number;
  total_cells: number;
  by_rat: { rat: string; stations: number; cells: number; share_pct: number }[];
  by_operator: { operator: { id: number; name: string }; stations: number; cells: number }[];
}

export interface StatsSummary {
  total_permits: number;
  total_unique_stations: number;
  by_rat: { rat: string; unique_stations: number; permits: number; share_pct: number }[];
  by_operator: { operator: { id: number; name: string }; unique_stations: number; permits: number }[];
  internal: InternalSummary;
}

export interface StatsPermitRow {
  operator: { id: number; name: string };
  band: { id: number; name: string; rat: string };
  unique_stations: number;
  permits_count: number;
  share_pct: number;
}

export interface InternalPermitRow {
  operator: { id: number; name: string };
  band: { id: number; name: string; rat: string };
  stations: number;
  cells: number;
  share_pct: number;
}

export interface StatsPermitsResponse {
  uke: StatsPermitRow[];
  internal: InternalPermitRow[];
}

export interface VoivodeshipUkeRow {
  region: { id: number; name: string };
  operator: { id: number; name: string };
  unique_stations: number;
  permits: number;
}

export interface VoivodeshipInternalRow {
  region: { id: number; name: string };
  operator: { id: number; name: string };
  stations: number;
  cells: number;
}

export interface StatsVoivodeshipsResponse {
  uke: VoivodeshipUkeRow[];
  internal: VoivodeshipInternalRow[];
}

export interface StatsHistoryRow {
  date: string;
  operator: { id: number; name: string };
  band: { id: number; name: string };
  unique_stations: number;
  permits_count: number;
}

export const fetchStatsSummary = (operatorId?: number) =>
  fetchApiData<StatsSummary>(`stats/summary${operatorId ? `?operator_id=${operatorId}` : ""}`);

export const fetchStatsPermits = (operatorId?: number) =>
  fetchApiData<StatsPermitsResponse>(`stats/permits${operatorId ? `?operator_id=${operatorId}` : ""}`);

export const fetchStatsHistory = (params?: { operator_id?: number; band_id?: number; from?: string; to?: string; granularity?: string }) => {
  const search = new URLSearchParams();
  if (params?.operator_id) search.set("operator_id", String(params.operator_id));
  if (params?.band_id) search.set("band_id", String(params.band_id));
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  if (params?.granularity) search.set("granularity", params.granularity);
  const qs = search.toString();
  return fetchApiData<StatsHistoryRow[]>(`stats/permits/history${qs ? `?${qs}` : ""}`);
};

export const fetchStatsVoivodeships = (operatorId?: number) =>
  fetchApiData<StatsVoivodeshipsResponse>(`stats/voivodeships${operatorId ? `?operator_id=${operatorId}` : ""}`);
