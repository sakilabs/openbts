import type { Operator, Station, UkeLocation, UkePermit } from "@/types/station";
import { postApiData } from "@/lib/api";
import { forwardGeocode } from "@/lib/mapboxGeocoding";
import type { OSMResult } from "./types";

const GPS_REGEX = /([+-]?\d+\.\d+)[,\s]+\s*([+-]?\d+\.\d+)/;

export function parseGpsCoordinates(query: string): { lat: number; lng: number } | null {
  const match = query.match(GPS_REGEX);
  if (!match) return null;
  const lat = Number.parseFloat(match[1]!);
  const lng = Number.parseFloat(match[2]!);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export const searchStations = (query: string) => postApiData<Station[], { query: string }>("search", { query });

export type UkeSearchPermitStation = {
  station_id: string;
  operator: Operator | null;
  location: UkeLocation | null;
  permits: UkePermit[];
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

    return results.slice(0, 5);
  } catch {
    return [];
  }
}
