export type { GeocodingResult as OSMResult } from "@/lib/mapboxGeocoding";

export type ParsedFilter = {
  key: string;
  value: string;
  raw: string;
};

export type FilterKeyword = {
  key: string;
  description: string;
  availableOn: ("map" | "stations")[];
};
