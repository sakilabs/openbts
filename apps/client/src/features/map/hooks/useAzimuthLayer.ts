import { getOperatorColor } from "@openbts/shared/operatorUtils";
import type { GeoJSONSource } from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";

import type { LocationWithStations, UkeLocationWithPermits } from "@/types/station";

import {
  INTERNAL_AZIMUTHS_FILL_LAYER_ID,
  INTERNAL_AZIMUTHS_LABEL_LAYER_ID,
  INTERNAL_AZIMUTHS_LABEL_SOURCE_ID,
  INTERNAL_AZIMUTHS_OUTLINE_LAYER_ID,
  INTERNAL_AZIMUTHS_OUTLINE_SOURCE_ID,
  INTERNAL_AZIMUTHS_SOURCE_ID,
  POINT_LAYER_ID,
  UKE_AZIMUTHS_FILL_LAYER_ID,
  UKE_AZIMUTHS_LABEL_LAYER_ID,
  UKE_AZIMUTHS_LABEL_SOURCE_ID,
  UKE_AZIMUTHS_OUTLINE_LAYER_ID,
  UKE_AZIMUTHS_OUTLINE_SOURCE_ID,
  UKE_AZIMUTHS_SOURCE_ID,
} from "../constants";
import { DEFAULT_COLOR } from "../geojson";
import { destinationPoint } from "../utils";

const EMPTY_GEOJSON: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

type AzimuthPoint = { latitude: number; longitude: number; entries: { azimuth: number; color: string }[] };

type AzimuthFeatures = {
  fills: GeoJSON.Feature[];
  outlines: GeoJSON.Feature[];
  labels: GeoJSON.Feature[];
};

const AZIMUTH_ARC_SEGMENT_DEGREES = 4;

function hasAzimuth<T extends { azimuth: number | null | undefined }>(sector: T): sector is T & { azimuth: number } {
  return sector.azimuth !== null && sector.azimuth !== undefined;
}

function buildAzimuthArcCoordinates(lat: number, lng: number, startAngle: number, endAngle: number, lineLength: number): [number, number][] {
  const angleSpan = endAngle - startAngle;
  const segmentCount = Math.max(1, Math.ceil(Math.abs(angleSpan) / AZIMUTH_ARC_SEGMENT_DEGREES));
  const arcCoordinates: [number, number][] = [];

  for (let i = 0; i <= segmentCount; i++) {
    const angle = startAngle + (angleSpan * i) / segmentCount;
    const [pointLat, pointLng] = destinationPoint(lat, lng, angle, lineLength);
    arcCoordinates.push([pointLng, pointLat]);
  }

  return arcCoordinates;
}

function buildAzimuthFeatures(points: AzimuthPoint[], lineLength: number, triangleHalfAngle: number): AzimuthFeatures {
  const fills: GeoJSON.Feature[] = [];
  const outlines: GeoJSON.Feature[] = [];
  const labels: GeoJSON.Feature[] = [];

  for (const { latitude: lat, longitude: lng, entries } of points) {
    if (lat === null || lng === null || entries.length === 0) continue;

    const azimuthColors = new Map<number, string[]>();
    for (const { azimuth, color } of entries) {
      const existing = azimuthColors.get(azimuth);
      if (existing) {
        if (!existing.includes(color)) existing.push(color);
      } else {
        azimuthColors.set(azimuth, [color]);
      }
    }

    for (const [azimuth, colors] of azimuthColors) {
      const startAngle = azimuth - triangleHalfAngle;
      const endAngle = azimuth + triangleHalfAngle;
      const wedgeAngle = (triangleHalfAngle * 2) / colors.length;

      const outlineArcCoordinates = buildAzimuthArcCoordinates(lat, lng, startAngle, endAngle, lineLength);

      outlines.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[[lng, lat], ...outlineArcCoordinates, [lng, lat]]],
        },
        properties: { color: colors[0] },
      });

      for (let i = 0; i < colors.length; i++) {
        const fillStartAngle = startAngle + i * wedgeAngle;
        const fillEndAngle = startAngle + (i + 1) * wedgeAngle;
        const fillArcCoordinates = buildAzimuthArcCoordinates(lat, lng, fillStartAngle, fillEndAngle, lineLength);
        fills.push({
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[[lng, lat], ...fillArcCoordinates, [lng, lat]]],
          },
          properties: { color: colors[i] },
        });
      }

      const [labelLat, labelLng] = destinationPoint(lat, lng, azimuth, lineLength * 0.55);
      labels.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [labelLng, labelLat] },
        properties: { label: `${azimuth}°` },
      });
    }
  }

  return { fills, outlines, labels };
}

function ukeLocationsToAzimuthPoints(locations: UkeLocationWithPermits[]): AzimuthPoint[] {
  return locations.map((loc) => ({
    latitude: loc.latitude,
    longitude: loc.longitude,
    entries: (loc.permits ?? []).flatMap((permit) => {
      const color = permit?.operator?.mnc ? getOperatorColor(permit.operator.mnc) : DEFAULT_COLOR;
      return (permit.sectors ?? []).filter(hasAzimuth).map((sector) => ({ azimuth: sector.azimuth, color }));
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

type GeoJSONTriple = { fill: GeoJSON.FeatureCollection; outline: GeoJSON.FeatureCollection; label: GeoJSON.FeatureCollection };

function makeGeoJSONTriple(points: AzimuthPoint[], lineLength: number, triangleHalfAngle: number): GeoJSONTriple {
  const { fills, outlines, labels } = buildAzimuthFeatures(points, lineLength, triangleHalfAngle);
  return {
    fill: { type: "FeatureCollection", features: fills },
    outline: { type: "FeatureCollection", features: outlines },
    label: { type: "FeatureCollection", features: labels },
  };
}

const EMPTY_TRIPLE: GeoJSONTriple = { fill: EMPTY_GEOJSON, outline: EMPTY_GEOJSON, label: EMPTY_GEOJSON };

function createFillLayerConfig(id: string, sourceId: string, minzoom: number): maplibregl.LayerSpecification {
  return {
    id,
    type: "fill",
    source: sourceId,
    minzoom,
    paint: {
      "fill-color": ["get", "color"],
      "fill-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0.15, 17, 0.3],
    },
  };
}

function createOutlineLayerConfig(id: string, sourceId: string, minzoom: number): maplibregl.LayerSpecification {
  return {
    id,
    type: "line",
    source: sourceId,
    minzoom,
    paint: {
      "line-color": ["get", "color"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 13, 1, 18, 2],
      "line-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0.5, 17, 0.85],
    },
  };
}

function createLabelLayerConfig(id: string, sourceId: string, minzoom: number): maplibregl.LayerSpecification {
  return {
    id,
    type: "symbol",
    source: sourceId,
    minzoom,
    layout: {
      "text-field": ["get", "label"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 14, 10, 18, 14],
      "text-allow-overlap": false,
      "text-anchor": "center",
    },
    paint: {
      "text-color": "#111111",
      "text-halo-color": "rgba(255,255,255,0.9)",
      "text-halo-width": 2,
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
  spread: number;
};

export function useAzimuthLayer({ map, isLoaded, locations, ukeLocations, enabled, minZoom, lineLength, spread }: UseAzimuthLayerArgs) {
  const halfAngle = spread / 2;
  const ukeTriple = useMemo(
    () => (enabled ? makeGeoJSONTriple(ukeLocationsToAzimuthPoints(ukeLocations), lineLength, halfAngle) : EMPTY_TRIPLE),
    [enabled, lineLength, ukeLocations, halfAngle],
  );
  const internalTriple = useMemo(
    () => (enabled ? makeGeoJSONTriple(internalLocationsToAzimuthPoints(locations), lineLength, halfAngle) : EMPTY_TRIPLE),
    [locations, enabled, lineLength, halfAngle],
  );

  const ukeTripleRef = useRef(ukeTriple);
  ukeTripleRef.current = ukeTriple;
  const internalTripleRef = useRef(internalTriple);
  internalTripleRef.current = internalTriple;

  useEffect(() => {
    if (!map || !isLoaded || !enabled) return;

    const ensureLayersExist = () => {
      try {
        const beforeLayer = map.getLayer(POINT_LAYER_ID) ? POINT_LAYER_ID : undefined;

        if (!map.getSource(INTERNAL_AZIMUTHS_SOURCE_ID))
          map.addSource(INTERNAL_AZIMUTHS_SOURCE_ID, { type: "geojson", data: internalTripleRef.current.fill });
        if (!map.getLayer(INTERNAL_AZIMUTHS_FILL_LAYER_ID))
          map.addLayer(createFillLayerConfig(INTERNAL_AZIMUTHS_FILL_LAYER_ID, INTERNAL_AZIMUTHS_SOURCE_ID, minZoom), beforeLayer);

        if (!map.getSource(INTERNAL_AZIMUTHS_OUTLINE_SOURCE_ID))
          map.addSource(INTERNAL_AZIMUTHS_OUTLINE_SOURCE_ID, { type: "geojson", data: internalTripleRef.current.outline });
        if (!map.getLayer(INTERNAL_AZIMUTHS_OUTLINE_LAYER_ID))
          map.addLayer(createOutlineLayerConfig(INTERNAL_AZIMUTHS_OUTLINE_LAYER_ID, INTERNAL_AZIMUTHS_OUTLINE_SOURCE_ID, minZoom), beforeLayer);

        if (!map.getSource(INTERNAL_AZIMUTHS_LABEL_SOURCE_ID))
          map.addSource(INTERNAL_AZIMUTHS_LABEL_SOURCE_ID, { type: "geojson", data: internalTripleRef.current.label });
        if (!map.getLayer(INTERNAL_AZIMUTHS_LABEL_LAYER_ID))
          map.addLayer(createLabelLayerConfig(INTERNAL_AZIMUTHS_LABEL_LAYER_ID, INTERNAL_AZIMUTHS_LABEL_SOURCE_ID, minZoom), beforeLayer);

        if (!map.getSource(UKE_AZIMUTHS_SOURCE_ID)) map.addSource(UKE_AZIMUTHS_SOURCE_ID, { type: "geojson", data: ukeTripleRef.current.fill });
        if (!map.getLayer(UKE_AZIMUTHS_FILL_LAYER_ID))
          map.addLayer(createFillLayerConfig(UKE_AZIMUTHS_FILL_LAYER_ID, UKE_AZIMUTHS_SOURCE_ID, minZoom), beforeLayer);

        if (!map.getSource(UKE_AZIMUTHS_OUTLINE_SOURCE_ID))
          map.addSource(UKE_AZIMUTHS_OUTLINE_SOURCE_ID, { type: "geojson", data: ukeTripleRef.current.outline });
        if (!map.getLayer(UKE_AZIMUTHS_OUTLINE_LAYER_ID))
          map.addLayer(createOutlineLayerConfig(UKE_AZIMUTHS_OUTLINE_LAYER_ID, UKE_AZIMUTHS_OUTLINE_SOURCE_ID, minZoom), beforeLayer);

        if (!map.getSource(UKE_AZIMUTHS_LABEL_SOURCE_ID))
          map.addSource(UKE_AZIMUTHS_LABEL_SOURCE_ID, { type: "geojson", data: ukeTripleRef.current.label });
        if (!map.getLayer(UKE_AZIMUTHS_LABEL_LAYER_ID))
          map.addLayer(createLabelLayerConfig(UKE_AZIMUTHS_LABEL_LAYER_ID, UKE_AZIMUTHS_LABEL_SOURCE_ID, minZoom), beforeLayer);
      } catch {
        // Layer may not exist yet
      }
    };

    ensureLayersExist();
    map.on("styledata", ensureLayersExist);

    return () => {
      map.off("styledata", ensureLayersExist);
      for (const layerId of [
        INTERNAL_AZIMUTHS_FILL_LAYER_ID,
        INTERNAL_AZIMUTHS_OUTLINE_LAYER_ID,
        INTERNAL_AZIMUTHS_LABEL_LAYER_ID,
        UKE_AZIMUTHS_FILL_LAYER_ID,
        UKE_AZIMUTHS_OUTLINE_LAYER_ID,
        UKE_AZIMUTHS_LABEL_LAYER_ID,
      ]) {
        try {
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        } catch {}
      }
      for (const sourceId of [
        INTERNAL_AZIMUTHS_SOURCE_ID,
        INTERNAL_AZIMUTHS_OUTLINE_SOURCE_ID,
        INTERNAL_AZIMUTHS_LABEL_SOURCE_ID,
        UKE_AZIMUTHS_SOURCE_ID,
        UKE_AZIMUTHS_OUTLINE_SOURCE_ID,
        UKE_AZIMUTHS_LABEL_SOURCE_ID,
      ]) {
        try {
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        } catch {}
      }
    };
  }, [map, isLoaded, enabled, minZoom]);

  useEffect(() => {
    if (!map || !isLoaded || !enabled) return;
    void (map.getSource(UKE_AZIMUTHS_SOURCE_ID) as GeoJSONSource | undefined)?.setData(ukeTriple.fill);
    void (map.getSource(UKE_AZIMUTHS_OUTLINE_SOURCE_ID) as GeoJSONSource | undefined)?.setData(ukeTriple.outline);
    void (map.getSource(UKE_AZIMUTHS_LABEL_SOURCE_ID) as GeoJSONSource | undefined)?.setData(ukeTriple.label);
  }, [map, isLoaded, enabled, ukeTriple]);

  useEffect(() => {
    if (!map || !isLoaded || !enabled) return;
    void (map.getSource(INTERNAL_AZIMUTHS_SOURCE_ID) as GeoJSONSource | undefined)?.setData(internalTriple.fill);
    void (map.getSource(INTERNAL_AZIMUTHS_OUTLINE_SOURCE_ID) as GeoJSONSource | undefined)?.setData(internalTriple.outline);
    void (map.getSource(INTERNAL_AZIMUTHS_LABEL_SOURCE_ID) as GeoJSONSource | undefined)?.setData(internalTriple.label);
  }, [map, isLoaded, enabled, internalTriple]);
}
