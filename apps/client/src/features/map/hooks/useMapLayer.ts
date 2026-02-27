import { useEffect, useRef, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import MapLibreGL from "maplibre-gl";
import { POINT_LAYER_ID, SOURCE_ID } from "../constants";
import { syncPieImages, syncMarkerImages } from "../pieChart";
import type { MapPointStyle } from "@/hooks/usePreferences";

type FeatureClickData = {
  coordinates: [number, number];
  locationId: number;
  city?: string;
  address?: string;
  source: string;
};

type FeatureClickHandler = (data: FeatureClickData) => void;

type UseMapLayerArgs = {
  map: maplibregl.Map | null;
  isLoaded: boolean;
  geoJSON: GeoJSON.FeatureCollection;
  onFeatureClick: FeatureClickHandler;
  onFeatureContextMenu?: FeatureClickHandler;
  onFeatureMouseDown?: (locationId: number) => void;
  renderHoverTooltip?: (data: FeatureClickData) => ReactNode | null;
  pointStyle?: MapPointStyle;
};

type ActiveTooltip = {
  popup: maplibregl.Popup;
  root: ReturnType<typeof createRoot>;
  activeLocationId: number;
};

function destroyTooltip(state: ActiveTooltip | null): null {
  state?.root.unmount();
  state?.popup.remove();
  return null;
}

function buildTooltip(state: ActiveTooltip | null, locationId: number): ActiveTooltip {
  if (state?.activeLocationId === locationId) return state;

  state?.root.unmount();
  state?.popup.remove();

  const container = document.createElement("div");
  const root = createRoot(container);
  const popup = new MapLibreGL.Popup({
    closeButton: false,
    closeOnClick: false,
    className: "station-hover-tooltip",
    maxWidth: "none",
    offset: 12,
  }).setDOMContent(container);

  return { popup, root, activeLocationId: locationId };
}

const SYMBOL_LAYER_ID = `${POINT_LAYER_ID}-symbol`;
const LAYER_IDS = [POINT_LAYER_ID, SYMBOL_LAYER_ID] as const;

const CIRCLE_LAYER_CONFIG: maplibregl.LayerSpecification = {
  id: POINT_LAYER_ID,
  type: "circle",
  source: SOURCE_ID,
  filter: ["!", ["get", "isMultiOperator"]],
  paint: {
    "circle-color": ["get", "color"],
    "circle-radius": 7,
    "circle-stroke-width": 2,
    "circle-stroke-color": "#fff",
  },
};

const SYMBOL_LAYER_CONFIG: maplibregl.LayerSpecification = {
  id: SYMBOL_LAYER_ID,
  type: "symbol",
  source: SOURCE_ID,
  filter: ["get", "isMultiOperator"],
  layout: {
    "icon-image": ["get", "pieImageId"],
    "icon-size": 0.5,
    "icon-allow-overlap": true,
  },
};

const MARKER_SINGLE_LAYER_CONFIG: maplibregl.LayerSpecification = {
  id: POINT_LAYER_ID,
  type: "symbol",
  source: SOURCE_ID,
  filter: ["!", ["get", "isMultiOperator"]],
  layout: {
    "icon-image": ["concat", "mpin-", ["get", "color"]],
    "icon-size": 1,
    "icon-allow-overlap": true,
    "icon-anchor": "bottom",
  },
};

const MARKER_MULTI_LAYER_CONFIG: maplibregl.LayerSpecification = {
  id: SYMBOL_LAYER_ID,
  type: "symbol",
  source: SOURCE_ID,
  filter: ["get", "isMultiOperator"],
  layout: {
    "icon-image": ["concat", "m", ["get", "pieImageId"]],
    "icon-size": 1,
    "icon-allow-overlap": true,
    "icon-anchor": "bottom",
  },
};

function extractFeatureClickData(feature: GeoJSON.Feature): FeatureClickData | null {
  if (feature.geometry.type !== "Point") return null;

  const { locationId, city, address, source } = feature.properties ?? {};
  if (!locationId) return null;

  return {
    coordinates: feature.geometry.coordinates as [number, number],
    locationId,
    city,
    address,
    source: source || "internal",
  };
}

export function useMapLayer({
  map,
  isLoaded,
  geoJSON,
  onFeatureClick,
  onFeatureContextMenu,
  onFeatureMouseDown,
  renderHoverTooltip,
  pointStyle = "dots",
}: UseMapLayerArgs) {
  const callbackRefs = useRef({ onFeatureClick, onFeatureContextMenu, onFeatureMouseDown, renderHoverTooltip });
  callbackRefs.current = { onFeatureClick, onFeatureContextMenu, onFeatureMouseDown, renderHoverTooltip };
  const tooltipRef = useRef<ActiveTooltip | null>(null);

  const geoJSONRef = useRef(geoJSON);
  geoJSONRef.current = geoJSON;

  const addedImagesRef = useRef(new Set<string>());

  useEffect(() => {
    if (!map || !isLoaded) return;

    const ensureLayersExist = () => {
      if (!map) return;

      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, { type: "geojson", data: geoJSONRef.current });
        addedImagesRef.current.clear();
      }

      if (pointStyle === "markers") {
        if (!map.getLayer(POINT_LAYER_ID)) map.addLayer(MARKER_SINGLE_LAYER_CONFIG);
        if (!map.getLayer(SYMBOL_LAYER_ID)) map.addLayer(MARKER_MULTI_LAYER_CONFIG);
        syncMarkerImages(map, geoJSONRef.current.features, addedImagesRef.current);
      } else {
        if (!map.getLayer(POINT_LAYER_ID)) map.addLayer(CIRCLE_LAYER_CONFIG);
        if (!map.getLayer(SYMBOL_LAYER_ID)) map.addLayer(SYMBOL_LAYER_CONFIG);
        syncPieImages(map, geoJSONRef.current.features, addedImagesRef.current);
      }
    };

    const handleMouseDown = (e: maplibregl.MapMouseEvent) => {
      const { onFeatureMouseDown } = callbackRefs.current;
      if (!onFeatureMouseDown) return;

      const features = map.queryRenderedFeatures(e.point, { layers: [...LAYER_IDS] });
      const locationId = features[0]?.properties?.locationId;
      if (locationId) onFeatureMouseDown(locationId);
    };

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [...LAYER_IDS] });
      const data = features[0] && extractFeatureClickData(features[0]);
      if (data) callbackRefs.current.onFeatureClick(data);
    };

    const handleContextMenu = (e: maplibregl.MapMouseEvent) => {
      const { onFeatureContextMenu } = callbackRefs.current;
      if (!onFeatureContextMenu) return;

      const features = map.queryRenderedFeatures(e.point, { layers: [...LAYER_IDS] });
      const data = features[0] && extractFeatureClickData(features[0]);
      if (data) {
        e.preventDefault();
        onFeatureContextMenu(data);
      }
    };

    const handleMouseEnter = (e: maplibregl.MapMouseEvent) => {
      map.getCanvas().style.cursor = "pointer";

      const { renderHoverTooltip } = callbackRefs.current;
      if (!renderHoverTooltip) return;

      const features = map.queryRenderedFeatures(e.point, { layers: [...LAYER_IDS] });
      const data = features[0] && extractFeatureClickData(features[0]);
      if (!data) return;

      const content = renderHoverTooltip(data);
      if (!content) return;

      const tooltip = buildTooltip(tooltipRef.current, data.locationId);
      tooltipRef.current = tooltip;
      tooltip.root.render(content);
      tooltip.popup.setLngLat(data.coordinates).addTo(map);
    };

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      const { renderHoverTooltip } = callbackRefs.current;
      if (!renderHoverTooltip || !tooltipRef.current) return;

      const features = map.queryRenderedFeatures(e.point, { layers: [...LAYER_IDS] });
      const data = features[0] && extractFeatureClickData(features[0]);

      if (!data) {
        tooltipRef.current = destroyTooltip(tooltipRef.current);
        return;
      }

      if (tooltipRef.current.activeLocationId === data.locationId) {
        tooltipRef.current.popup.setLngLat(data.coordinates);
        return;
      }

      const content = renderHoverTooltip(data);
      if (!content) return;

      const tooltip = buildTooltip(tooltipRef.current, data.locationId);
      tooltipRef.current = tooltip;
      tooltip.root.render(content);
      tooltip.popup.setLngLat(data.coordinates).addTo(map);
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      tooltipRef.current = destroyTooltip(tooltipRef.current);
    };

    ensureLayersExist();
    map.on("styledata", ensureLayersExist);

    for (const layerId of LAYER_IDS) {
      map.on("mousedown", layerId, handleMouseDown);
      map.on("click", layerId, handleClick);
      map.on("contextmenu", layerId, handleContextMenu);
      map.on("mouseenter", layerId, handleMouseEnter);
      map.on("mousemove", layerId, handleMouseMove);
      map.on("mouseleave", layerId, handleMouseLeave);
    }

    return () => {
      const isMapValid = map.getStyle() !== undefined;

      if (isMapValid) {
        map.off("styledata", ensureLayersExist);

        for (const layerId of LAYER_IDS) {
          map.off("mousedown", layerId, handleMouseDown);
          map.off("click", layerId, handleClick);
          map.off("contextmenu", layerId, handleContextMenu);
          map.off("mouseenter", layerId, handleMouseEnter);
          map.off("mousemove", layerId, handleMouseMove);
          map.off("mouseleave", layerId, handleMouseLeave);
        }

        try {
          for (const layerId of LAYER_IDS) {
            if (map.getLayer(layerId)) map.removeLayer(layerId);
          }
          if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        } catch {}
      }

      addedImagesRef.current.clear();
      tooltipRef.current = destroyTooltip(tooltipRef.current);
    };
  }, [map, isLoaded, pointStyle]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const source = map.getSource(SOURCE_ID) as MapLibreGL.GeoJSONSource | undefined;
    if (!source) return;

    if (pointStyle === "markers") {
      syncMarkerImages(map, geoJSON.features, addedImagesRef.current);
    } else {
      syncPieImages(map, geoJSON.features, addedImagesRef.current);
    }
    source.setData(geoJSON);
  }, [map, isLoaded, geoJSON, pointStyle]);
}
