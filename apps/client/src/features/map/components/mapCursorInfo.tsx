import { useCallback, useEffect, useRef, useState } from "react";

import { useMap } from "@/components/ui/map";
import { Separator } from "@/components/ui/separator";
import { usePreferences } from "@/hooks/usePreferences";
import { formatCoordinates } from "@/lib/gpsUtils";
import { cn } from "@/lib/utils";

import { calculateBearing, calculateDistance, calculateTA } from "../utils";

const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

type SavedMeasurement = {
  marker: { lat: number; lng: number };
  cursor: { lat: number; lng: number };
};

function generateCirclePolygon(lat: number, lng: number, radiusMeters: number): GeoJSON.Feature {
  const R = 6371000;
  const numPoints = 256;
  const δ = radiusMeters / R;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
  const coords: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const bearing = (i / numPoints) * 2 * Math.PI;
    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(bearing));
    const λ2 = λ1 + Math.atan2(Math.sin(bearing) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
    coords.push([(λ2 * 180) / Math.PI, (φ2 * 180) / Math.PI]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coords] } };
}

type MapCursorInfoProps = {
  activeMarker?: { latitude: number; longitude: number } | null;
  onActiveMarkerClear?: () => void;
  className?: string;
};

export function MapCursorInfo({ activeMarker, onActiveMarkerClear, className }: MapCursorInfoProps) {
  const { map, isLoaded } = useMap();
  const { preferences } = usePreferences();
  const [cursor, setCursor] = useState<{ lat: number; lng: number } | null>(null);
  const [lastSaved, setLastSaved] = useState<SavedMeasurement | null>(null);

  const activeMarkerRef = useRef(activeMarker);
  const circleEnabledRef = useRef(preferences.mapMeasureCircle);
  const circleVisibleRef = useRef(true);
  const cursorRef = useRef<{ lat: number; lng: number } | null>(null);
  const lineSourceRef = useRef<maplibregl.GeoJSONSource | null>(null);
  const circleSourceRef = useRef<maplibregl.GeoJSONSource | null>(null);
  const savedLineSourceRef = useRef<maplibregl.GeoJSONSource | null>(null);
  const savedCircleSourceRef = useRef<maplibregl.GeoJSONSource | null>(null);
  const savedMeasurementsRef = useRef<SavedMeasurement[]>([]);
  const sourcesPopulated = useRef(false);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    activeMarkerRef.current = activeMarker;
  }, [activeMarker]);
  useEffect(() => {
    circleEnabledRef.current = preferences.mapMeasureCircle;
    if (preferences.mapMeasureCircle) circleVisibleRef.current = true;
  }, [preferences.mapMeasureCircle]);

  const markerLat = activeMarker?.latitude ?? null;
  const markerLng = activeMarker?.longitude ?? null;
  const circleEnabled = preferences.mapMeasureCircle;

  const updateSavedSources = useCallback(() => {
    const measurements = savedMeasurementsRef.current;
    savedLineSourceRef.current?.setData({
      type: "FeatureCollection",
      features: measurements.map(({ marker, cursor }) => ({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [marker.lng, marker.lat],
            [cursor.lng, cursor.lat],
          ],
        },
      })),
    });
    savedCircleSourceRef.current?.setData(
      circleEnabledRef.current && circleVisibleRef.current
        ? {
            type: "FeatureCollection",
            features: measurements.map(({ marker, cursor }) =>
              generateCirclePolygon(marker.lat, marker.lng, calculateDistance(marker.lat, marker.lng, cursor.lat, cursor.lng)),
            ),
          }
        : EMPTY_FC,
    );
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === " ") {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        const marker = activeMarkerRef.current;
        const cursor = cursorRef.current;
        if (!marker || !cursor) return;
        const measurement = { marker: { lat: marker.latitude, lng: marker.longitude }, cursor };
        savedMeasurementsRef.current = [...savedMeasurementsRef.current, measurement];
        updateSavedSources();
        setLastSaved(measurement);
        onActiveMarkerClear?.();
      } else if (e.key.toLowerCase() === "c") {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (!circleEnabledRef.current) return;
        (document.activeElement as HTMLElement | null)?.blur();
        circleVisibleRef.current = !circleVisibleRef.current;
        updateSavedSources();
        const marker = activeMarkerRef.current;
        const cursor = cursorRef.current;
        if (marker && cursor) {
          if (circleVisibleRef.current) {
            const radius = calculateDistance(marker.latitude, marker.longitude, cursor.lat, cursor.lng);
            circleSourceRef.current?.setData(generateCirclePolygon(marker.latitude, marker.longitude, radius));
          } else circleSourceRef.current?.setData(EMPTY_FC);
        }
      } else if (e.key === "Escape") {
        savedMeasurementsRef.current = [];
        updateSavedSources();
        setLastSaved(null);
      }
    },
    [updateSavedSources, onActiveMarkerClear],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    if (!map.getSource("cursor-measure-line")) {
      map.addSource("cursor-measure-line", { type: "geojson", data: EMPTY_FC });
    }
    lineSourceRef.current = map.getSource("cursor-measure-line") as maplibregl.GeoJSONSource;

    if (!map.getLayer("cursor-measure-line")) {
      map.addLayer({
        id: "cursor-measure-line",
        type: "line",
        source: "cursor-measure-line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#f59f0b", "line-width": 2, "line-dasharray": [2, 1] },
      });
    }

    return () => {
      lineSourceRef.current = null;
      if (map.getStyle() === undefined) return;
      if (map.getLayer("cursor-measure-line")) map.removeLayer("cursor-measure-line");
      if (map.getSource("cursor-measure-line")) map.removeSource("cursor-measure-line");
    };
  }, [map, isLoaded]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    if (!map.getSource("cursor-measure-circle")) {
      map.addSource("cursor-measure-circle", { type: "geojson", data: EMPTY_FC });
    }
    circleSourceRef.current = map.getSource("cursor-measure-circle") as maplibregl.GeoJSONSource;

    if (!map.getLayer("cursor-measure-circle-fill")) {
      map.addLayer({
        id: "cursor-measure-circle-fill",
        type: "fill",
        source: "cursor-measure-circle",
        paint: { "fill-color": "#f59f0b", "fill-opacity": 0.08 },
      });
    }

    if (!map.getLayer("cursor-measure-circle-line")) {
      map.addLayer({
        id: "cursor-measure-circle-line",
        type: "line",
        source: "cursor-measure-circle",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#f59f0b", "line-width": 2 },
      });
    }

    return () => {
      circleSourceRef.current = null;
      if (map.getStyle() === undefined) return;
      if (map.getLayer("cursor-measure-circle-line")) map.removeLayer("cursor-measure-circle-line");
      if (map.getLayer("cursor-measure-circle-fill")) map.removeLayer("cursor-measure-circle-fill");
      if (map.getSource("cursor-measure-circle")) map.removeSource("cursor-measure-circle");
    };
  }, [map, isLoaded]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    if (!map.getSource("saved-measure-lines")) {
      map.addSource("saved-measure-lines", { type: "geojson", data: EMPTY_FC });
    }
    savedLineSourceRef.current = map.getSource("saved-measure-lines") as maplibregl.GeoJSONSource;
    if (!map.getLayer("saved-measure-lines")) {
      map.addLayer({
        id: "saved-measure-lines",
        type: "line",
        source: "saved-measure-lines",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#f59f0b", "line-width": 2 },
      });
    }
    return () => {
      savedLineSourceRef.current = null;
      if (map.getStyle() === undefined) return;
      if (map.getLayer("saved-measure-lines")) map.removeLayer("saved-measure-lines");
      if (map.getSource("saved-measure-lines")) map.removeSource("saved-measure-lines");
    };
  }, [map, isLoaded]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    if (!map.getSource("saved-measure-circles")) {
      map.addSource("saved-measure-circles", { type: "geojson", data: EMPTY_FC });
    }
    savedCircleSourceRef.current = map.getSource("saved-measure-circles") as maplibregl.GeoJSONSource;
    if (!map.getLayer("saved-measure-circles-fill")) {
      map.addLayer({
        id: "saved-measure-circles-fill",
        type: "fill",
        source: "saved-measure-circles",
        paint: { "fill-color": "#f59f0b", "fill-opacity": 0.12 },
      });
    }
    if (!map.getLayer("saved-measure-circles-line")) {
      map.addLayer({
        id: "saved-measure-circles-line",
        type: "line",
        source: "saved-measure-circles",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#f59f0b", "line-width": 2 },
      });
    }
    return () => {
      savedCircleSourceRef.current = null;
      if (map.getStyle() === undefined) return;
      if (map.getLayer("saved-measure-circles-line")) map.removeLayer("saved-measure-circles-line");
      if (map.getLayer("saved-measure-circles-fill")) map.removeLayer("saved-measure-circles-fill");
      if (map.getSource("saved-measure-circles")) map.removeSource("saved-measure-circles");
    };
  }, [map, isLoaded]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const onMouseMove = (e: maplibregl.MapMouseEvent) => {
      const { lat, lng } = e.lngLat;
      cursorRef.current = { lat, lng };
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setCursor({ lat, lng });
      });

      const marker = activeMarkerRef.current;
      if (marker) {
        sourcesPopulated.current = true;
        lineSourceRef.current?.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [marker.longitude, marker.latitude],
              [lng, lat],
            ],
          },
        });
        if (circleEnabledRef.current && circleVisibleRef.current) {
          const radius = calculateDistance(marker.latitude, marker.longitude, lat, lng);
          circleSourceRef.current?.setData(generateCirclePolygon(marker.latitude, marker.longitude, radius));
        } else {
          circleSourceRef.current?.setData(EMPTY_FC);
        }
      } else if (sourcesPopulated.current) {
        sourcesPopulated.current = false;
        lineSourceRef.current?.setData(EMPTY_FC);
        circleSourceRef.current?.setData(EMPTY_FC);
      }
    };

    map.on("mousemove", onMouseMove);
    queueMicrotask(() => {
      const center = map.getCenter();
      cursorRef.current = cursorRef.current ?? { lat: center.lat, lng: center.lng };
      setCursor((prev) => prev ?? { lat: center.lat, lng: center.lng });
    });

    return () => {
      map.off("mousemove", onMouseMove);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [map, isLoaded]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    const cursor = cursorRef.current;

    if (markerLat !== null && markerLng !== null && cursor) {
      sourcesPopulated.current = true;
      lineSourceRef.current?.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [markerLng, markerLat],
            [cursor.lng, cursor.lat],
          ],
        },
      });
      if (circleEnabled && circleVisibleRef.current) {
        const radius = calculateDistance(markerLat, markerLng, cursor.lat, cursor.lng);
        circleSourceRef.current?.setData(generateCirclePolygon(markerLat, markerLng, radius));
      } else {
        circleSourceRef.current?.setData(EMPTY_FC);
      }
    } else {
      sourcesPopulated.current = false;
      lineSourceRef.current?.setData(EMPTY_FC);
      circleSourceRef.current?.setData(EMPTY_FC);
    }
  }, [map, isLoaded, markerLat, markerLng, circleEnabled]);

  const metricsMarker = activeMarker ? { lat: activeMarker.latitude, lng: activeMarker.longitude } : (lastSaved?.marker ?? null);
  const metricsCursor = activeMarker ? cursor : (lastSaved?.cursor ?? null);

  let metrics = null;
  if (metricsMarker && metricsCursor) {
    const distMeters = calculateDistance(metricsMarker.lat, metricsMarker.lng, metricsCursor.lat, metricsCursor.lng);
    const bearing = calculateBearing(metricsMarker.lat, metricsMarker.lng, metricsCursor.lat, metricsCursor.lng);
    const ta = calculateTA(distMeters);

    metrics = {
      ref: metricsMarker,
      dist: distMeters > 1000 ? `${(distMeters / 1000).toFixed(2)} km` : `${Math.round(distMeters)} m`,
      bearing: Math.round(bearing),
      ta,
    };
  }

  return (
    <div className={cn("select-none invisible md:visible", className)}>
      <div className="flex items-stretch shadow-xl rounded-lg overflow-hidden border bg-background/95 backdrop-blur-md">
        <div className="px-2.5 py-1.5 flex items-center gap-2 border-r border-border/50">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-none">GPS</span>
            <span className="text-xs font-mono font-bold tabular-nums text-foreground leading-none">
              {cursor ? formatCoordinates(cursor.lat, cursor.lng, preferences.gpsFormat) : "0.00000, 0.00000"}
            </span>
          </div>
        </div>

        {metrics && (
          <div className="bg-muted/30 px-2.5 py-1.5 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] uppercase font-bold text-muted-foreground leading-none">REF</span>
              <span className="text-xs font-mono font-bold tabular-nums text-foreground leading-none">
                {formatCoordinates(metrics.ref.lat, metrics.ref.lng, preferences.gpsFormat)}
              </span>
            </div>

            <div className="w-px h-3 bg-border/60" />

            <div className="flex items-center gap-1.5">
              <span className="text-[8px] uppercase font-bold text-muted-foreground leading-none">Dist</span>
              <span className="text-xs font-mono font-bold tabular-nums text-foreground leading-none">{metrics.dist}</span>
            </div>

            <div className="w-px h-3 bg-border/60" />

            <div className="flex items-center gap-1.5">
              <span className="text-[8px] uppercase font-bold text-muted-foreground leading-none">Azm</span>
              <span className="text-xs font-mono font-bold tabular-nums text-foreground leading-none">{metrics.bearing}°</span>
            </div>

            <div className="w-px h-3 bg-border/60" />

            <div className="flex items-center gap-1.5">
              <span className="text-[8px] uppercase font-bold text-muted-foreground leading-none">TA</span>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold tabular-nums text-foreground leading-none">
                <span className="flex items-center gap-0.5" title="GSM Timing Advance">
                  <span className="text-[8px] text-muted-foreground/70">GSM</span>
                  {metrics.ta.gsm}
                </span>
                <Separator orientation="vertical" className="h-3 bg-border/50" />
                <span className="flex items-center gap-0.5" title="UMTS Chips (One-way)">
                  <span className="text-[8px] text-muted-foreground/70">UMTS</span>
                  {metrics.ta.umts}
                </span>
                <Separator orientation="vertical" className="h-3 bg-border/50" />
                <span className="flex items-center gap-0.5" title="LTE Timing Advance">
                  <span className="text-[8px] text-muted-foreground/70">LTE</span>
                  {metrics.ta.lte}
                </span>
                <Separator orientation="vertical" className="h-3 bg-border/50" />
                <span className="flex items-center gap-0.5" title="NR Timing Advance (SCS 30kHz)">
                  <span className="text-[8px] text-muted-foreground/70">NR</span>
                  {metrics.ta.nr}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
