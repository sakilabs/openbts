import { useEffect, useRef } from "react";
import type { StationFilters, StationSource } from "@/types/station";

type UseUrlSyncArgs = {
  map: maplibregl.Map | null;
  isLoaded: boolean;
  filters: StationFilters;
  zoom: number;
  onInitialize: (data: {
    filters?: StationFilters;
    center?: [number, number];
    zoom?: number;
    stationId?: string;
    locationId?: number;
    radiolineId?: number;
  }) => void;
};

const FILTER_PARAM_KEYS = ["operators", "bands", "rat", "source", "new", "radiolines", "stations", "rl_operators"];

function parseUrlHash(): {
  filters: Partial<StationFilters> | null;
  center?: [number, number];
  zoom?: number;
  stationId?: string;
  locationId?: number;
  radiolineId?: number;
} {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  if (!hash.startsWith("map=")) {
    return { filters: null };
  }

  const [mapPart, queryPart = ""] = hash.split("?");
  const mapValue = mapPart.replace("map=", "");
  const [zStr, latStr, lngStr] = mapValue.split("/");

  const z = Number.parseFloat(zStr || "");
  const lat = Number.parseFloat(latStr || "");
  const lng = Number.parseFloat(lngStr || "");

  const params = new URLSearchParams(queryPart);

  const hasFilterParams = FILTER_PARAM_KEYS.some((key) => params.has(key));

  const operators =
    params
      .get("operators")
      ?.split(",")
      .map(Number)
      .filter((n) => !Number.isNaN(n)) || [];
  const bands =
    params
      .get("bands")
      ?.split(",")
      .map(Number)
      .filter((n) => !Number.isNaN(n)) || [];
  const rat = params.get("rat")?.split(",").filter(Boolean) || [];
  const source = (params.get("source") as StationSource) || "internal";
  const newParam = params.get("new");
  const recentDays = newParam === "true" ? 30 : newParam ? Math.min(30, Math.max(1, Number(newParam))) || null : null;
  const showRadiolines = params.get("radiolines") === "1";
  const showStations = params.get("stations") !== "0";
  const radiolineOperators =
    params
      .get("rl_operators")
      ?.split(",")
      .map(Number)
      .filter((n) => !Number.isNaN(n)) || [];

  const stationId = params.get("station") || undefined;

  const locationIdStr = params.get("location");
  const locationId = locationIdStr ? Number.parseInt(locationIdStr, 10) : undefined;

  const radiolineIdStr = params.get("radioline");
  const radiolineId = radiolineIdStr ? Number.parseInt(radiolineIdStr, 10) : undefined;

  return {
    filters: hasFilterParams ? { operators, bands, rat, source, recentDays, showStations, showRadiolines, radiolineOperators } : null,
    center: !Number.isNaN(lat) && !Number.isNaN(lng) ? [lng, lat] : undefined,
    zoom: !Number.isNaN(z) ? z : undefined,
    stationId,
    locationId: locationId && !Number.isNaN(locationId) ? locationId : undefined,
    radiolineId: radiolineId && !Number.isNaN(radiolineId) ? radiolineId : undefined,
  };
}

function buildUrlHash(filters: StationFilters, map: maplibregl.Map, zoomOverride?: number): string {
  const params = new URLSearchParams();

  if (filters.operators.length > 0) params.set("operators", filters.operators.join(","));
  if (filters.bands.length > 0) params.set("bands", filters.bands.join(","));
  if (filters.rat.length > 0) params.set("rat", filters.rat.join(","));
  params.set("source", filters.source);
  if (filters.recentDays !== null) params.set("new", String(filters.recentDays));
  if (filters.showRadiolines) params.set("radiolines", "1");
  if (!filters.showStations) params.set("stations", "0");
  if (filters.radiolineOperators.length > 0) params.set("rl_operators", filters.radiolineOperators.join(","));

  const center = map.getCenter();
  const zoom = zoomOverride ?? map.getZoom();

  const mapPart = `map=${zoom.toFixed(2)}/${center.lat.toFixed(6)}/${center.lng.toFixed(6)}`;
  const query = params.toString();

  return `#${mapPart}${query ? `?${query}` : ""}`;
}

export function useUrlSync({ map, isLoaded, filters, zoom, onInitialize }: UseUrlSyncArgs) {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isLoaded || !map || isInitialized.current) return;

    const { filters: urlFilters, center, zoom: urlZoom, stationId, locationId, radiolineId } = parseUrlHash();

    if (center || urlZoom !== undefined) {
      map.flyTo({
        center: center ?? map.getCenter(),
        zoom: urlZoom ?? map.getZoom(),
        essential: true,
        speed: 1.5,
      });
    }

    onInitialize({
      filters: urlFilters
        ? {
            operators: urlFilters.operators || [],
            bands: urlFilters.bands || [],
            rat: urlFilters.rat || [],
            source: urlFilters.source || "internal",
            recentDays: urlFilters.recentDays ?? null,
            showStations: urlFilters.showStations ?? true,
            showRadiolines: urlFilters.showRadiolines ?? false,
            radiolineOperators: urlFilters.radiolineOperators || [],
          }
        : undefined,
      center,
      zoom: urlZoom,
      stationId,
      locationId,
      radiolineId,
    });

    isInitialized.current = true;
  }, [isLoaded, map, onInitialize]);

  useEffect(() => {
    if (!isLoaded || !map || !isInitialized.current) return;

    const newUrl = `${window.location.pathname}${buildUrlHash(filters, map, zoom)}`;
    window.history.replaceState(null, "", newUrl);
  }, [filters, isLoaded, map, zoom]);
}
