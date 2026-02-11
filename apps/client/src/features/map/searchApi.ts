import type { Station } from "@/types/station";
import { fetchJson, postApiData } from "@/lib/api";
import type { OSMResult } from "./types";

export { fetchOperators, fetchBands } from "@/features/shared/api";

export const searchStations = (query: string) => postApiData<Station[], { query: string }>("search", { query });

export async function searchLocations(query: string): Promise<OSMResult[]> {
	if (query.length < 3) return [];

	const url = new URL("https://nominatim.openstreetmap.org/search");
	url.searchParams.set("format", "json");
	url.searchParams.set("q", query);
	url.searchParams.set("limit", "10");
	url.searchParams.set("addressdetails", "1");
	url.searchParams.set("countrycodes", "pl");

	try {
		const results = await fetchJson<OSMResult[]>(url.toString());

		const isCity = (r: OSMResult) => r.addresstype === "city" || r.type === "city";
		return results.sort((a, b) => Number(isCity(b)) - Number(isCity(a))).slice(0, 5);
	} catch {
		return [];
	}
}
