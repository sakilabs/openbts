import type { StationFilters, LocationWithStations, UkeLocationWithPermits, RadioLine, UkePermit } from "@/types/station";
import { API_BASE, fetchJson } from "@/lib/api";

export type LocationsResponse = {
  data: LocationWithStations[];
  totalCount: number;
};

export type UkeLocationsResponse = {
  data: UkeLocationWithPermits[];
  totalCount: number;
};

function buildFilterParams(filters: StationFilters): URLSearchParams {
  const params = new URLSearchParams();

  const { operators, bands, rat, recentOnly } = filters;
  if (operators.length) params.set("operators", operators.join(","));
  if (bands.length) params.set("bands", bands.join(","));
  if (rat.length) params.set("rat", rat.join(","));
  if (recentOnly) params.set("new", "true");

  return params;
}

export async function fetchLocations(bounds: string, filters: StationFilters, limit = 1000): Promise<LocationsResponse> {
  if (filters.source === "uke") {
    const params = buildFilterParams(filters);
    params.set("limit", String(limit));
    params.set("bounds", bounds);
    const result = await fetchJson<UkeLocationsResponse>(`${API_BASE}/uke/locations?${decodeURIComponent(params.toString())}`);
    return { data: result.data as unknown as LocationWithStations[], totalCount: result.totalCount };
  }

  const params = buildFilterParams(filters);
  params.set("limit", String(limit));
  params.set("bounds", bounds);

  const result = await fetchJson<LocationsResponse>(`${API_BASE}/locations?${decodeURIComponent(params.toString())}`);
  return { data: result.data ?? [], totalCount: result.totalCount ?? 0 };
}

export async function fetchLocationWithStations(locationId: number, filters: StationFilters): Promise<LocationWithStations> {
  const params = buildFilterParams(filters);
  const filter = params.toString() === "" ? "" : `?${decodeURIComponent(params.toString())}`;
  const result = await fetchJson<{ data: LocationWithStations }>(`${API_BASE}/locations/${locationId}${filter}`);
  return result.data;
}

export async function fetchUkePermitsByStationId(stationId: string): Promise<UkePermit[]> {
  const params = new URLSearchParams();
  params.set("station_id", stationId);
  const result = await fetchJson<{ data: UkePermit[] }>(`${API_BASE}/uke/permits?${decodeURIComponent(params.toString())}`);
  return result.data;
}

export type RadioLinesResponse = {
  data: RadioLine[];
  totalCount: number;
};

export async function fetchRadioLines(
  bounds: string,
  options?: { signal?: AbortSignal; operatorIds?: number[]; limit?: number },
): Promise<RadioLinesResponse> {
  const params = new URLSearchParams();
  params.set("bounds", bounds);
  params.set("limit", String(options?.limit ?? 500));
  if (options?.operatorIds?.length) params.set("operators", options.operatorIds.join(","));

  return fetchJson<RadioLinesResponse>(`${API_BASE}/uke/radiolines?${decodeURIComponent(params.toString())}`, {
    signal: options?.signal,
  });
}
