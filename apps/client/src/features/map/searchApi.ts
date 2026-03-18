import type { Station } from "@/types/station";
import { postApiData } from "@/lib/api";
import { forwardGeocode } from "@/lib/mapboxGeocoding";
import type { OSMResult } from "./types";

export const searchStations = (query: string) => postApiData<Station[], { query: string }>("search", { query });

export async function searchLocations(query: string): Promise<OSMResult[]> {
  if (query.length < 3) return [];

  try {
    const results = await forwardGeocode(query);

    const isCity = (r: OSMResult) => r.addresstype === "place" || r.type === "place" || r.type === "locality";
    return results.sort((a, b) => Number(isCity(b)) - Number(isCity(a))).slice(0, 5);
  } catch {
    return [];
  }
}
