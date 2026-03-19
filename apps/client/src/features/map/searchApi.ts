import type { Station } from "@/types/station";
import { postApiData } from "@/lib/api";
import { forwardGeocode } from "@/lib/mapboxGeocoding";
import type { OSMResult } from "./types";

export const searchStations = (query: string) => postApiData<Station[], { query: string }>("search", { query });

export type UkeSearchPermitStation = {
  station_id: string;
  operator: { id: number; name: string; mnc: number | null } | null;
  location: { id: number; city: string | null; latitude: number; longitude: number } | null;
  permits: { id: number; decision_number: string; decision_type: string; band_id: number | null; expiry_date: string; source: string }[];
};

export type UkeSearchRadioline = {
  id: number;
  permit_number: string;
  operator: { id: number; name: string } | null;
  tx: { city: string | null; latitude: number; longitude: number };
  rx: { city: string | null; latitude: number; longitude: number };
};

export type UkeSearchResult = {
  stations: UkeSearchPermitStation[];
  radiolines: UkeSearchRadioline[];
};

export const searchUkePermits = (query: string) => postApiData<UkeSearchResult, { query: string }>("uke/search", { query });

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
