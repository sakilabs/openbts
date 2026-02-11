import { fetchJson, API_BASE } from "@/lib/api";
import type { LocationWithStations } from "@/types/station";

type LocationsResponse = { data: LocationWithStations[]; totalCount: number };

export async function fetchLocationsList(params: {
	page: number;
	limit: number;
	regions?: string;
	operators?: string;
	sort?: string;
	sortBy?: string;
}): Promise<LocationsResponse> {
	const searchParams = new URLSearchParams();
	searchParams.set("page", params.page.toString());
	searchParams.set("limit", params.limit.toString());
	if (params.regions) searchParams.set("regions", params.regions);
	if (params.operators) searchParams.set("operators", params.operators);
	if (params.sort) searchParams.set("sort", params.sort);
	if (params.sortBy) searchParams.set("sortBy", params.sortBy);
	return fetchJson<LocationsResponse>(`${API_BASE}/locations?${searchParams.toString()}`);
}

export async function fetchLocationDetail(id: number): Promise<LocationWithStations> {
	const res = await fetchJson<{ data: LocationWithStations }>(`${API_BASE}/locations/${id}`);
	return res.data;
}

export async function patchLocation(id: number, body: Record<string, unknown>) {
	return fetchJson<{ data: unknown }>(`${API_BASE}/locations/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}
