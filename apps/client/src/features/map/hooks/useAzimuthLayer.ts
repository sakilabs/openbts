import type MapLibreGL from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";

import { getOperatorColor } from "@/lib/operatorUtils";
import type { UkeLocationWithPermits } from "@/types/station";

import { AZIMUTHS_LINE_LAYER_ID, AZIMUTHS_SOURCE_ID, POINT_LAYER_ID } from "../constants";
import { DEFAULT_COLOR } from "../geojson";
import { destinationPoint } from "../utils";

const EMPTY_GEOJSON: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

function azimuthsToGeoJSON(locations: UkeLocationWithPermits[], lineLength: number): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const location of locations) {
    if (location.latitude == null || location.longitude == null || !location.permits?.length) continue;

    const { latitude: lat, longitude: lng } = location;

    for (const permit of location.permits) {
      if (!permit.sectors?.length) continue;

      const color = permit.operator?.mnc ? getOperatorColor(permit.operator.mnc) : DEFAULT_COLOR;

      for (const sector of permit.sectors) {
        if (sector.azimuth == null) continue;

        const [destLat, destLng] = destinationPoint(lat, lng, sector.azimuth, lineLength);

        features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [lng, lat],
              [destLng, destLat],
            ],
          },
          properties: {
            azimuth: sector.azimuth,
            color,
          },
        });
      }
    }
  }

  return { type: "FeatureCollection", features };
}

function createAzimuthLayerConfig(minzoom: number): maplibregl.LayerSpecification {
  return {
    id: AZIMUTHS_LINE_LAYER_ID,
    type: "line",
    source: AZIMUTHS_SOURCE_ID,
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
  locations: UkeLocationWithPermits[];
  enabled: boolean;
  minZoom: number;
  lineLength: number;
};

export function useAzimuthLayer({ map, isLoaded, locations, enabled, minZoom, lineLength }: UseAzimuthLayerArgs) {
  const geoJSON = useMemo(() => (enabled ? azimuthsToGeoJSON(locations, lineLength) : EMPTY_GEOJSON), [locations, enabled, lineLength]);
  const geoJSONRef = useRef(geoJSON);
  geoJSONRef.current = geoJSON;

  useEffect(() => {
    if (!map || !isLoaded || !enabled) return;

    const ensureLayersExist = () => {
      try {
        const beforeLayer = map.getLayer(POINT_LAYER_ID) ? POINT_LAYER_ID : undefined;

        if (!map.getSource(AZIMUTHS_SOURCE_ID)) map.addSource(AZIMUTHS_SOURCE_ID, { type: "geojson", data: geoJSONRef.current });
        if (!map.getLayer(AZIMUTHS_LINE_LAYER_ID)) map.addLayer(createAzimuthLayerConfig(minZoom), beforeLayer);
      } catch {
        // Layer may not exist
      }
    };

    ensureLayersExist();
    map.on("styledata", ensureLayersExist);

    return () => {
      map.off("styledata", ensureLayersExist);
      try {
        if (map.getLayer(AZIMUTHS_LINE_LAYER_ID)) map.removeLayer(AZIMUTHS_LINE_LAYER_ID);
      } catch {}
      try {
        if (map.getSource(AZIMUTHS_SOURCE_ID)) map.removeSource(AZIMUTHS_SOURCE_ID);
      } catch {}
    };
  }, [map, isLoaded, enabled, minZoom]);

  useEffect(() => {
    if (!map || !isLoaded || !enabled) return;
    (map.getSource(AZIMUTHS_SOURCE_ID) as MapLibreGL.GeoJSONSource | undefined)?.setData(geoJSON);
  }, [map, isLoaded, enabled, geoJSON]);
}
