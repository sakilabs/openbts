import type { StationFilters } from "@/types/station";
import { API_BASE, fetchJson } from "@/lib/api";

function buildFilterParams(filters: StationFilters): URLSearchParams {
	const params = new URLSearchParams();

	const { operators, bands, rat } = filters;
	if (operators.length) params.set("operators", operators.join(","));
	if (bands.length) params.set("bands", bands.join(","));
	if (rat.length) params.set("rat", rat.join(","));

	return params;
}

export async function fetchStations(bounds: string, filters: StationFilters): Promise<unknown[]> {
	const endpoint = filters.source === "uke" ? "uke/permits" : "stations";
	const params = buildFilterParams(filters);
	params.set("limit", "500");
	params.set("bounds", bounds);

	const result = await fetchJson<{ data: unknown[] }>(`${API_BASE}/${endpoint}?${decodeURIComponent(params.toString())}`);
	return result.data ?? [];
}
