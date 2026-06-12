import { API_BASE, fetchJson } from "@/lib/api";
import type { Operator, Region } from "@/types/station";

type PlannedStatus = "PLANNED" | "COMPLETED" | "CANCELED";
type Lab = { PCA: string; name: string };
type Location = {
  longitude: number;
  latitude: number;
  city: string;
  address: string;
};
type DateObj = {
  from: string;
  to: string;
};
export type PlannedPEMStation = {
  id: number;
  station_id: string;
  location: Location;
  region: Region;
  operator: Operator;
  lab: Lab;
  date: DateObj;
  status: PlannedStatus;
};
export type PlannedPEMsResponse = {
  totalCount: number;
  data: PlannedPEMStation[];
};
type PlannedParams = {
  page: number;
  limit: number;
  status: PlannedStatus;
  plmn?: number;
};

export async function fetchPlannedMeasurements(params: PlannedParams): Promise<PlannedPEMsResponse> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit ?? 25),
    status: params.status,
  });

  return fetchJson<PlannedPEMsResponse>(`${API_BASE}/pem/planned?${searchParams.toString()}`);
}
