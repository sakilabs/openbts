import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMap } from "@/components/ui/map";

import type {
  StationFilters,
  StationSource,
  LocationWithStations,
  LocationInfo,
  StationWithoutCells,
  UkeStation,
  UkeLocationWithPermits,
} from "@/types/station";
import type { LocationsResponse } from "../api";
import { fetchLocationWithStations } from "../api";
import { fetchStation, fetchUkePermit } from "@/features/station-details/api";
import { locationsToGeoJSON, ukeLocationsToGeoJSON } from "../geojson";
import { groupPermitsByStation } from "../utils";
import { useUrlSync } from "../hooks/useURLSync";
import { useMapLayer } from "../hooks/useMapLayer";
import { showApiError } from "@/lib/api";
import { POINT_LAYER_ID } from "../constants";

export const DEFAULT_FILTERS: StationFilters = {
  operators: [],
  bands: [],
  rat: [],
  source: "internal",
  recentOnly: false,
  showStations: true,
  showRadiolines: false,
  radiolineOperators: [],
};

const MAP_FILTERS_STORAGE_KEY = "map:filters";

export function saveMapFilters(filters: StationFilters) {
  try {
    localStorage.setItem(MAP_FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // ignore localStorage errors
  }
}

export function loadMapFilters(): StationFilters | null {
  try {
    const raw = localStorage.getItem(MAP_FILTERS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      operators: parsed.operators ?? [],
      bands: parsed.bands ?? [],
      rat: parsed.rat ?? [],
      source: parsed.source ?? "internal",
      recentOnly: parsed.recentOnly ?? false,
      showStations: parsed.showStations ?? true,
      showRadiolines: parsed.showRadiolines ?? false,
      radiolineOperators: parsed.radiolineOperators ?? [],
    };
  } catch {
    return null;
  }
}

type PrefetchCache = Map<
  number,
  {
    promise: Promise<LocationWithStations>;
    data?: LocationWithStations;
  }
>;

function toLocationInfo(loc: LocationWithStations): LocationInfo {
  return {
    id: loc.id,
    city: loc.city,
    address: loc.address,
    latitude: loc.latitude,
    longitude: loc.longitude,
  };
}

type ShowPopupFn = (
  coordinates: [number, number],
  location: LocationInfo,
  stations: StationWithoutCells[] | null,
  ukeStations: UkeStation[] | null,
  source: StationSource,
) => void;

type UpdatePopupStationsFn = (location: LocationInfo, stations: StationWithoutCells[], source: StationSource) => void;

type StationsLayerProps = {
  filters: StationFilters;
  onFiltersChange: (filters: StationFilters) => void;
  locationsResponse: LocationsResponse | undefined;
  zoom: number;
  onActiveMarkerChange: (marker: { latitude: number; longitude: number } | null) => void;
  onOpenStationDetails: (id: number, source: StationSource) => void;
  onOpenUkeStationDetails: (station: UkeStation) => void;
  onRadiolineIdFromUrl?: (id: number) => void;
  showPopup: ShowPopupFn;
  updatePopupStations: UpdatePopupStationsFn;
  cleanupPopup: () => void;
};

export function StationsLayer({
  filters,
  onFiltersChange,
  locationsResponse,
  zoom,
  onActiveMarkerChange,
  onOpenStationDetails,
  onOpenUkeStationDetails,
  onRadiolineIdFromUrl,
  showPopup,
  updatePopupStations,
  cleanupPopup,
}: StationsLayerProps) {
  const { map, isLoaded } = useMap();
  const pendingStationId = useRef<number | string | undefined>(null);
  const pendingLocationId = useRef<number | null>(null);
  const pendingUkeLocationId = useRef<number | null>(null);

  const handleUrlInitialize = useCallback(
    async ({
      filters: urlFilters,
      stationId,
      locationId,
      radiolineId,
    }: {
      filters?: StationFilters;
      stationId?: string;
      locationId?: number;
      radiolineId?: number;
    }) => {
      if (urlFilters) {
        onFiltersChange(urlFilters);
      }
      const activeFilters = urlFilters ?? filters;

      if (stationId && map) {
        pendingStationId.current = stationId;
        const stationPromise =
          activeFilters.source === "uke"
            ? fetchUkePermit(stationId).then((permits) => {
                const ukeStation = groupPermitsByStation(permits ?? [])[0];
                if (ukeStation?.location?.latitude && ukeStation?.location?.longitude) {
                  map.flyTo({
                    center: [ukeStation.location.longitude, ukeStation.location.latitude],
                    zoom: 16,
                    essential: true,
                    speed: 1.5,
                  });
                  onOpenUkeStationDetails(ukeStation);
                }
              })
            : fetchStation(Number(stationId)).then((station) => {
                if (station.location?.latitude && station.location?.longitude) {
                  map.flyTo({
                    center: [station.location.longitude, station.location.latitude],
                    zoom: 16,
                    essential: true,
                    speed: 1.5,
                  });
                  onOpenStationDetails(Number(stationId), "internal");
                }
              });
        stationPromise
          .catch((error) => {
            console.error("Failed to fetch shared station:", error);
            showApiError(error);
          })
          .finally(() => {
            pendingStationId.current = null;
          });
      } else if (radiolineId) onRadiolineIdFromUrl?.(radiolineId);
      else if (locationId && map) {
        if (activeFilters.source === "uke") {
          pendingUkeLocationId.current = locationId;
          return;
        }

        pendingLocationId.current = locationId;
        fetchLocationWithStations(locationId, activeFilters)
          .then((locationData) => {
            const location = toLocationInfo(locationData);
            map.flyTo({
              center: [location.longitude, location.latitude],
              zoom: 16,
              essential: true,
              speed: 1.5,
            });
            return new Promise<typeof locationData>((resolve) => map.once("moveend", () => resolve(locationData)));
          })
          .then((locationData) => {
            const location = toLocationInfo(locationData);
            showPopup([location.longitude, location.latitude], location, locationData.stations as StationWithoutCells[], null, activeFilters.source);
          })
          .catch((error) => {
            console.error("Failed to fetch shared location:", error);
            showApiError(error);
          })
          .finally(() => {
            pendingLocationId.current = null;
          });
      }
    },
    [map, filters, showPopup, onFiltersChange, onOpenStationDetails, onOpenUkeStationDetails, onRadiolineIdFromUrl],
  );

  useUrlSync({
    map,
    isLoaded,
    filters,
    zoom,
    onInitialize: handleUrlInitialize,
  });

  const prefetchCacheRef = useRef<PrefetchCache>(new Map());
  useEffect(() => {
    prefetchCacheRef.current = new Map();
  }, []);

  const locations = locationsResponse?.data ?? [];

  const EMPTY_GEOJSON: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

  const geoJSON = useMemo(() => {
    if (!filters.showStations) return EMPTY_GEOJSON;
    return filters.source === "uke"
      ? ukeLocationsToGeoJSON(locations as unknown as UkeLocationWithPermits[], filters.source)
      : locationsToGeoJSON(locations, filters.source);
  }, [locations, filters.source, filters.showStations]);

  useEffect(() => {
    const locationId = pendingUkeLocationId.current;
    if (!locationId || !map || filters.source !== "uke" || locations.length === 0) return;

    const ukeLocations = locations as unknown as UkeLocationWithPermits[];
    const ukeLocation = ukeLocations.find((loc) => loc.id === locationId);
    if (!ukeLocation) return;

    pendingUkeLocationId.current = null;

    const location: LocationInfo = {
      id: ukeLocation.id,
      city: ukeLocation.city ?? undefined,
      address: ukeLocation.address ?? undefined,
      latitude: ukeLocation.latitude,
      longitude: ukeLocation.longitude,
    };

    map.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 16,
      essential: true,
      speed: 1.5,
    });

    const handleMoveEnd = () => {
      const ukeStations = groupPermitsByStation(ukeLocation.permits ?? [], ukeLocation);
      showPopup([location.longitude, location.latitude], location, null, ukeStations, filters.source);
    };

    map.once("moveend", handleMoveEnd);

    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [map, locations, filters.source, showPopup]);

  const fetchAndUpdatePopup = useCallback(
    async (locationId: number, _location: LocationInfo, source: StationSource) => {
      const cache = prefetchCacheRef.current;
      const cached = cache.get(locationId);
      const dataPromise =
        cached?.data !== undefined ? Promise.resolve(cached.data) : cached ? cached.promise : fetchLocationWithStations(locationId, filters);
      try {
        const data = await dataPromise;
        updatePopupStations(toLocationInfo(data), data.stations, source);
      } catch (error: unknown) {
        console.error("Failed to fetch station cells:", error);
        showApiError(error);
      }
    },
    [filters, updatePopupStations],
  );

  const handleFeatureMouseDown = useCallback(
    (locationId: number) => {
      const cache = prefetchCacheRef.current;
      if (filters.source === "uke" || cache.has(locationId)) return;

      const entry = {
        promise: fetchLocationWithStations(locationId, filters).then((data) => {
          entry.data = data;
          return data;
        }),
        data: undefined as LocationWithStations | undefined,
      };
      cache.set(locationId, entry);
    },
    [filters],
  );

  const handleFeatureClick = useCallback(
    async (data: { coordinates: [number, number]; locationId: number; city?: string; address?: string; source: string }) => {
      const { coordinates, locationId, city, address, source } = data;
      const [lng, lat] = coordinates;

      if (source === "uke") {
        const ukeLocation = (locations as unknown as UkeLocationWithPermits[]).find((loc) => loc.id === locationId);
        const ukeStations = groupPermitsByStation(ukeLocation?.permits ?? [], ukeLocation);
        showPopup(coordinates, { id: locationId, city, address, latitude: lat, longitude: lng }, null, ukeStations, source as StationSource);
        return;
      }

      const locationData = locations.find((loc) => loc.id === locationId);
      const location: LocationInfo = {
        id: locationId,
        city: locationData?.city ?? city,
        address: locationData?.address ?? address,
        latitude: lat,
        longitude: lng,
      };

      showPopup(coordinates, location, locationData?.stations ?? null, null, source as StationSource);
      await fetchAndUpdatePopup(locationId, location, source as StationSource);
    },
    [locations, showPopup, fetchAndUpdatePopup],
  );

  const handleFeatureContextMenu = useCallback(
    async (data: { coordinates: [number, number]; locationId: number; city?: string; address?: string; source: string }) => {
      const { coordinates } = data;
      const [lng, lat] = coordinates;
      onActiveMarkerChange({ latitude: lat, longitude: lng });
    },
    [onActiveMarkerChange],
  );

  useMapLayer({
    map,
    isLoaded,
    geoJSON,
    onFeatureClick: handleFeatureClick,
    onFeatureContextMenu: handleFeatureContextMenu,
    onFeatureMouseDown: handleFeatureMouseDown,
  });

  useEffect(() => cleanupPopup, [cleanupPopup]);

  useEffect(() => {
    if (!map) return;

    const handleContextMenu = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [POINT_LAYER_ID, `${POINT_LAYER_ID}-symbol`] });
      if (features.length === 0) onActiveMarkerChange(null);
    };

    map.on("contextmenu", handleContextMenu);
    return () => {
      map.off("contextmenu", handleContextMenu);
    };
  }, [map, onActiveMarkerChange]);

  if (!isLoaded) return null;

  return null;
}
