import { useEffect, useRef } from "react";

import type { StationFilters, StationSource } from "@/types/station";

type UseUrlSyncArgs = {
  map: maplibregl.Map | null;
  isLoaded: boolean;
  filters: StationFilters;
  onInitialize: (data: {
    filters?: StationFilters;
    center?: [number, number];
    zoom?: number;
    stationId?: string;
    locationId?: number;
    radiolineId?: number;
  }) => void;
};

const LEGACY_FILTER_PARAM_KEYS = ["operators", "bands", "rat", "source", "new", "radiolines", "stations", "rl_operators", "heatmap"];

function parseLegacyFilters(params: URLSearchParams): Partial<StationFilters> | null {
  if (!LEGACY_FILTER_PARAM_KEYS.some((key) => params.has(key))) return null;

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
  const source: StationSource = params.get("source") === "uke" ? "uke" : "internal";
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
  const showHeatmap = params.get("heatmap") === "1";

  return { operators, bands, rat, source, recentDays, showStations, showRadiolines, radiolineOperators, showHeatmap };
}

function parseTokenFilters(tokens: string[]): Partial<StationFilters> | null {
  if (tokens.length === 0) return null;

  let operators: number[] = [];
  let bands: number[] = [];
  let rat: string[] = [];
  let recentDays: number | null = null;
  let showRadiolines = false;
  let showStations = true;
  let showHeatmap = false;
  let source: StationSource = "internal";
  let radiolineOperators: number[] = [];

  for (const token of tokens) {
    const key = token[0];
    const value = token.slice(1);
    switch (key) {
      case "o":
        operators = value
          .split(",")
          .map(Number)
          .filter((n) => !Number.isNaN(n));
        break;
      case "b":
        bands = value
          .split(",")
          .map(Number)
          .filter((n) => !Number.isNaN(n));
        break;
      case "r":
        rat = value.split(",").filter(Boolean);
        break;
      case "n":
        recentDays = Math.min(30, Math.max(1, Number(value))) || null;
        break;
      case "p":
        radiolineOperators = value
          .split(",")
          .map(Number)
          .filter((n) => !Number.isNaN(n));
        break;
      case "f":
        showRadiolines = value.includes("r");
        showHeatmap = value.includes("h");
        showStations = !value.includes("s");
        source = value.includes("u") ? "uke" : "internal";
        break;
    }
  }

  return { operators, bands, rat, source, recentDays, showStations, showRadiolines, radiolineOperators, showHeatmap };
}

function parseUrlHash(): {
  filters: Partial<StationFilters> | null;
  center?: [number, number];
  zoom?: number;
  stationId?: string;
  locationId?: number;
  radiolineId?: number;
} {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  if (!hash.startsWith("map=")) return { filters: null };

  const hasTokens = hash.includes("~");
  const hasQuery = hash.includes("?");

  const mapSegment = hash.split(hasTokens ? "~" : "?")[0];
  const mapValue = mapSegment.replace("map=", "");
  const [zStr, latStr, lngStr] = mapValue.split("/");

  const z = Number.parseFloat(zStr || "");
  const lat = Number.parseFloat(latStr || "");
  const lng = Number.parseFloat(lngStr || "");

  let filters: Partial<StationFilters> | null = null;
  let stationId: string | undefined;
  let locationId: number | undefined;
  let radiolineId: number | undefined;

  if (hasTokens) {
    const tokens = hash.split("~").slice(1);
    for (const token of tokens) {
      const key = token[0];
      const value = token.slice(1);
      if (key === "L") locationId = Number.parseInt(value, 10) || undefined;
      else if (key === "R") radiolineId = Number.parseInt(value, 10) || undefined;
      else if (key === "S") stationId = value || undefined;
    }
    filters = parseTokenFilters(tokens.filter((t) => t[0] !== "L" && t[0] !== "R" && t[0] !== "S"));
  } else if (hasQuery) {
    const queryPart = hash.split("?")[1] ?? "";
    const params = new URLSearchParams(queryPart);
    filters = parseLegacyFilters(params);
    stationId = params.get("station") || undefined;
    const locationIdStr = params.get("location");
    locationId = locationIdStr ? Number.parseInt(locationIdStr, 10) : undefined;
    const radiolineIdStr = params.get("radioline");
    radiolineId = radiolineIdStr ? Number.parseInt(radiolineIdStr, 10) : undefined;
  }

  return {
    filters,
    center: !Number.isNaN(lat) && !Number.isNaN(lng) ? [lng, lat] : undefined,
    zoom: !Number.isNaN(z) ? z : undefined,
    stationId,
    locationId: locationId !== undefined && !Number.isNaN(locationId) ? locationId : undefined,
    radiolineId: radiolineId !== undefined && !Number.isNaN(radiolineId) ? radiolineId : undefined,
  };
}

function buildUrlHash(filters: StationFilters, map: maplibregl.Map, zoomOverride?: number): string {
  const tokens: string[] = [];

  if (filters.operators.length > 0) tokens.push(`o${filters.operators.join(",")}`);
  if (filters.bands.length > 0) tokens.push(`b${filters.bands.join(",")}`);
  if (filters.rat.length > 0) tokens.push(`r${filters.rat.join(",")}`);
  if (filters.recentDays !== null) tokens.push(`n${filters.recentDays}`);

  const flags = [filters.showRadiolines && "r", filters.showHeatmap && "h", !filters.showStations && "s", filters.source === "uke" && "u"]
    .filter(Boolean)
    .join("");
  if (flags) tokens.push(`f${flags}`);

  if (filters.showRadiolines && filters.radiolineOperators.length > 0) tokens.push(`p${filters.radiolineOperators.join(",")}`);

  const center = map.getCenter();
  const zoom = zoomOverride ?? map.getZoom();
  const mapPart = `map=${zoom.toFixed(2)}/${center.lat.toFixed(6)}/${center.lng.toFixed(6)}`;

  return `#${mapPart}${tokens.length > 0 ? `~${tokens.join("~")}` : ""}`;
}

export function useUrlSync({ map, isLoaded, filters, onInitialize }: UseUrlSyncArgs) {
  const isInitialized = useRef(false);
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

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
            showHeatmap: urlFilters.showHeatmap ?? false,
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
    if (!isLoaded || !map) return;

    const handleMoveEnd = () => {
      if (!isInitialized.current) return;
      const newUrl = `${window.location.pathname}${buildUrlHash(filtersRef.current, map)}`;
      window.history.replaceState(null, "", newUrl);
    };

    map.on("moveend", handleMoveEnd);
    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [isLoaded, map]);

  useEffect(() => {
    if (!isLoaded || !map || !isInitialized.current) return;

    const newUrl = `${window.location.pathname}${buildUrlHash(filters, map)}`;
    window.history.replaceState(null, "", newUrl);
  }, [filters, isLoaded, map]);
}
