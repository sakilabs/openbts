import { getOperatorColor } from "@openbts/shared/operatorUtils";
import type { GeoJSONSource } from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";

import type { LocationWithStations, UkeLocationWithPermits } from "@/types/station";

import {
  INTERNAL_AZIMUTHS_LINE_LAYER_ID,
  INTERNAL_AZIMUTHS_SOURCE_ID,
  POINT_LAYER_ID,
  UKE_AZIMUTHS_LINE_LAYER_ID,
  UKE_AZIMUTHS_SOURCE_ID,
} from "../constants";
import { DEFAULT_COLOR } from "../geojson";
import { destinationPoint } from "../utils";

const EMPTY_GEOJSON: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

type AzimuthPoint = { latitude: number; longitude: number; entries: { azimuth: number; color: string }[] };

function buildAzimuthFeatures(points: AzimuthPoint[], lineLength: number): GeoJSON.Feature[] {
  const features: GeoJSON.Feature[] = [];

  for (const { latitude: lat, longitude: lng, entries } of points) {
    if (lat === null || lng === null || entries.length === 0) continue;

    const azimuthColors = new Map<number, string[]>();
    for (const { azimuth, color } of entries) {
      const existing = azimuthColors.get(azimuth);
      if (existing) existing.push(color);
      else azimuthColors.set(azimuth, [color]);
    }

    for (const [azimuth, colorList] of azimuthColors) {
      const uniqueColors = [...new Set(colorList)];

      if (uniqueColors.length === 1) {
        const [destLat, destLng] = destinationPoint(lat, lng, azimuth, lineLength);
        features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [lng, lat],
              [destLng, destLat],
            ],
          },
          properties: { azimuth, color: uniqueColors[0] },
        });
      } else {
        const totalSegments = uniqueColors.length * 4;
        for (let i = 0; i < totalSegments; i++) {
          const [startLat, startLng] = destinationPoint(lat, lng, azimuth, (i / totalSegments) * lineLength);
          const [endLat, endLng] = destinationPoint(lat, lng, azimuth, ((i + 1) / totalSegments) * lineLength);
          features.push({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [startLng, startLat],
                [endLng, endLat],
              ],
            },
            properties: { azimuth, color: uniqueColors[i % uniqueColors.length] },
          });
        }
      }
    }
  }

  return features;
}

function ukeLocationsToAzimuthPoints(locations: UkeLocationWithPermits[]): AzimuthPoint[] {
  return locations.map((loc) => ({
    latitude: loc.latitude,
    longitude: loc.longitude,
    entries: (loc.permits ?? []).flatMap((permit) => {
      const color = permit?.operator?.mnc ? getOperatorColor(permit.operator.mnc) : DEFAULT_COLOR;
      return (permit.sectors ?? [])
        .filter((sector) => sector.azimuth !== null && sector.azimuth !== undefined)
        .map((sector) => ({ azimuth: sector.azimuth!, color }));
    }),
  }));
}

function internalLocationsToAzimuthPoints(locations: LocationWithStations[]): AzimuthPoint[] {
  return locations.map((loc) => ({
    latitude: loc.latitude,
    longitude: loc.longitude,
    entries: (loc.stations ?? []).flatMap((station) => {
      const color = station.operator?.mnc ? getOperatorColor(station.operator.mnc) : DEFAULT_COLOR;
      return (station.sectors ?? []).map((sector) => ({ azimuth: sector.azimuth, color }));
    }),
  }));
}

function makeGeoJSON(points: AzimuthPoint[], lineLength: number): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: buildAzimuthFeatures(points, lineLength) };
}

function createAzimuthLayerConfig(id: string, sourceId: string, minzoom: number): maplibregl.LayerSpecification {
  return {
    id,
    type: "line",
    source: sourceId,
    minzoom,
    paint: {
      "line-color": ["get", "color"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 13, 1, 16, 2.5, 18, 4],
      "line-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0.3, 15, 0.6, 17, 0.85],
    },
  };
}

type UseAzimuthLayerArgs = {
  map: maplibregl.Map | null;
  isLoaded: boolean;
  locations: LocationWithStations[];
  ukeLocations: UkeLocationWithPermits[];
  enabled: boolean;
  minZoom: number;
  lineLength: number;
};

export function useAzimuthLayer({ map, isLoaded, locations, ukeLocations, enabled, minZoom, lineLength }: UseAzimuthLayerArgs) {
  const ukeGeoJSON = useMemo(
    () => (enabled ? makeGeoJSON(ukeLocationsToAzimuthPoints(ukeLocations), lineLength) : EMPTY_GEOJSON),
    [enabled, lineLength, ukeLocations],
  );
  const internalGeoJSON = useMemo(
    () => (enabled ? makeGeoJSON(internalLocationsToAzimuthPoints(locations), lineLength) : EMPTY_GEOJSON),
    [locations, enabled, lineLength],
  );
  const ukeGeoJSONRef = useRef(ukeGeoJSON);
  ukeGeoJSONRef.current = ukeGeoJSON;
  const internalGeoJSONRef = useRef(internalGeoJSON);
  internalGeoJSONRef.current = internalGeoJSON;

  useEffect(() => {
    if (!map || !isLoaded || !enabled) return;

    const ensureLayersExist = () => {
      try {
        const beforeLayer = map.getLayer(POINT_LAYER_ID) ? POINT_LAYER_ID : undefined;

        if (!map.getSource(INTERNAL_AZIMUTHS_SOURCE_ID))
          map.addSource(INTERNAL_AZIMUTHS_SOURCE_ID, { type: "geojson", data: internalGeoJSONRef.current });
        if (!map.getLayer(INTERNAL_AZIMUTHS_LINE_LAYER_ID))
          map.addLayer(createAzimuthLayerConfig(INTERNAL_AZIMUTHS_LINE_LAYER_ID, INTERNAL_AZIMUTHS_SOURCE_ID, minZoom), beforeLayer);

        if (!map.getSource(UKE_AZIMUTHS_SOURCE_ID)) map.addSource(UKE_AZIMUTHS_SOURCE_ID, { type: "geojson", data: ukeGeoJSONRef.current });
        if (!map.getLayer(UKE_AZIMUTHS_LINE_LAYER_ID))
          map.addLayer(createAzimuthLayerConfig(UKE_AZIMUTHS_LINE_LAYER_ID, UKE_AZIMUTHS_SOURCE_ID, minZoom), beforeLayer);
      } catch {
        // Layer may not exist
      }
    };

    ensureLayersExist();
    map.on("styledata", ensureLayersExist);

    return () => {
      map.off("styledata", ensureLayersExist);
      for (const layerId of [UKE_AZIMUTHS_LINE_LAYER_ID, INTERNAL_AZIMUTHS_LINE_LAYER_ID]) {
        try {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        } catch {}
      }
      for (const sourceId of [UKE_AZIMUTHS_SOURCE_ID, INTERNAL_AZIMUTHS_SOURCE_ID]) {
        try {
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        } catch {}
      }
    };
  }, [map, isLoaded, enabled, minZoom]);

  useEffect(() => {
    if (!map || !isLoaded || !enabled) return;
    void (map.getSource(UKE_AZIMUTHS_SOURCE_ID) as GeoJSONSource | undefined)?.setData(ukeGeoJSON);
  }, [map, isLoaded, enabled, ukeGeoJSON]);

  useEffect(() => {
    if (!map || !isLoaded || !enabled) return;
    void (map.getSource(INTERNAL_AZIMUTHS_SOURCE_ID) as GeoJSONSource | undefined)?.setData(internalGeoJSON);
  }, [map, isLoaded, enabled, internalGeoJSON]);
}
