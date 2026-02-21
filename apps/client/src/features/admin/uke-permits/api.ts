import { fetchJson, API_BASE } from "@/lib/api";
import type { UkeStation } from "@/types/station";

type UnassignedPermitsResponse = { data: UkeStation[]; totalCount: number };

export async function fetchUnassignedPermits(params: {
  page: number;
  limit: number;
  regions?: string;
  operators?: string;
}): Promise<UnassignedPermitsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", params.page.toString());
  searchParams.set("limit", params.limit.toString());
  if (params.regions) searchParams.set("regions", params.regions);
  if (params.operators) searchParams.set("operators", params.operators);
  return fetchJson<UnassignedPermitsResponse>(`${API_BASE}/uke/permits/unassigned?${searchParams.toString()}`);
}
