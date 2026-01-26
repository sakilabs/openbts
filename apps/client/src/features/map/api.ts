import type { StationFilters } from "@/types/station";
import { API_BASE, fetchJson } from "@/lib/api";

/** Build URL search params from filter values */
function buildFilterParams(filters: StationFilters): URLSearchParams {
	const params = new URLSearchParams();

	const { operators, bands, rat } = filters;
	if (operators.length) params.set("operators", operators.join(","));
	if (bands.length) params.set("bands", bands.join(","));
	if (rat.length) params.set("rat", rat.join(","));

	return params;
}

/** Fetch stations within map bounds */
export async function fetchStations(bounds: string, filters: StationFilters): Promise<any[]> {
	const endpoint = filters.source === "uke" ? "uke/permits" : "stations";
	const params = buildFilterParams(filters);
	params.set("limit", "500");
	params.set("bounds", bounds);

	const result = await fetchJson<{ data: any[] }>(`${API_BASE}/${endpoint}?${params}`);
	return result.data ?? [];
}
