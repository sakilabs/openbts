import type { StationFilters, LocationWithStations, UkeLocationWithPermits } from "@/types/station";
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

	const { operators, bands, rat } = filters;
	if (operators.length) params.set("operators", operators.join(","));
	if (bands.length) params.set("bands", bands.join(","));
	if (rat.length) params.set("rat", rat.join(","));

	return params;
}

export async function fetchLocations(bounds: string, filters: StationFilters): Promise<LocationsResponse> {
	if (filters.source === "uke") {
		const params = buildFilterParams(filters);
		params.set("limit", "500");
		params.set("bounds", bounds);
		const result = await fetchJson<UkeLocationsResponse>(`${API_BASE}/uke/locations?${decodeURIComponent(params.toString())}`);
		return { data: result.data as unknown as LocationWithStations[], totalCount: result.totalCount };
	}

	const params = buildFilterParams(filters);
	params.set("limit", "500");
	params.set("bounds", bounds);

	const result = await fetchJson<LocationsResponse>(`${API_BASE}/locations?${decodeURIComponent(params.toString())}`);
	return { data: result.data ?? [], totalCount: result.totalCount ?? 0 };
}

export async function fetchLocationWithStations(locationId: number, filters: StationFilters): Promise<LocationWithStations> {
	const params = buildFilterParams(filters);
	const result = await fetchJson<{ data: LocationWithStations }>(`${API_BASE}/locations/${locationId}?${decodeURIComponent(params.toString())}`);
	return result.data;
}
