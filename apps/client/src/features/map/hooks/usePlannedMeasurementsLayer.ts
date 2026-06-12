import { useEffect } from "react";

import { API_BASE } from "@/lib/api";

import { PLANNED_PEM_LAYER_ID, PLANNED_PEM_SOURCE_ID } from "../constants";

type MeasurementResponseType = {
  station_id: string;
  operator: string;
  lab: {
    PCA: string;
    name: string;
  };
  location: {
    longitude: number;
    latitude: number;
    city: string;
    address: string;
  };
  date: {
    from: string;
    to: string;
  };
  status: "PLANNED";
}[];

async function fetchWms(bounds: string): Promise<GeoJSON.FeatureCollection | null> {
  const res = await fetch(`${API_BASE}/pem/map?bounds=${encodeURIComponent(bounds)}`);
  if (!res.ok) return null;
  const { data }: { data: MeasurementResponseType } = await res.json();
  return {
    type: "FeatureCollection",
    features: data.map((f) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [f.location.longitude, f.location.latitude] },
      properties: {
        station_id: f.station_id,
        operator: f.operator,
        lab: f.lab,
        date: f.date,
        location: f.location,
        status: f.status,
      },
    })),
  };
}

function getBoundsString(map: maplibregl.Map): string {
  const bounds = map.getBounds();
  return `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
}

export function usePlannedMeasurementsLayer({ map, isLoaded, enabled }: { map: maplibregl.Map | null; isLoaded: boolean; enabled: boolean }) {
  useEffect(() => {
    if (!map || !isLoaded || !enabled) return;
    let cancelled = false;
    const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

    const initLayer = () => {
      if (!map.isStyleLoaded()) return;
      try {
        if (!map.getSource(PLANNED_PEM_SOURCE_ID)) {
          map.addSource(PLANNED_PEM_SOURCE_ID, { type: "geojson", data: EMPTY });
          if (!map.getLayer(PLANNED_PEM_LAYER_ID)) {
            map.addLayer({
              id: PLANNED_PEM_LAYER_ID,
              type: "circle",
              source: PLANNED_PEM_SOURCE_ID,
              paint: {
                "circle-radius": 6,
                "circle-color": "#f48c0c",
                "circle-stroke-width": 1.5,
                "circle-stroke-color": "#fff",
                "circle-opacity": 0.9,
              },
            });
          }
        }
      } catch {}
    };

    const loadData = () => {
      void fetchWms(getBoundsString(map)).then((data) => {
        if (cancelled || !data) return;
        try {
          void (map.getSource(PLANNED_PEM_SOURCE_ID) as maplibregl.GeoJSONSource)?.setData(data);
        } catch {}
      });
    };

    initLayer();

    map.on("styledata", loadData);
    map.on("moveend", loadData);

    return () => {
      cancelled = true;
      map.off("styledata", loadData);
      map.off("moveend", loadData);
      try {
        if (map.getStyle() !== undefined) {
          if (map.getLayer(PLANNED_PEM_LAYER_ID)) map.removeLayer(PLANNED_PEM_LAYER_ID);
          if (map.getLayer(PLANNED_PEM_SOURCE_ID)) map.removeLayer(PLANNED_PEM_SOURCE_ID);
        }
      } catch {}
    };
  }, [map, isLoaded, enabled]);
}
