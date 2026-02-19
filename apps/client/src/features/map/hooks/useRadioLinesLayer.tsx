import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import MapLibreGL from "maplibre-gl";
import {
  RADIOLINES_SOURCE_ID,
  RADIOLINES_ENDPOINTS_SOURCE_ID,
  RADIOLINES_LINE_LAYER_ID,
  RADIOLINES_HITBOX_LAYER_ID,
  RADIOLINES_ENDPOINT_LAYER_ID,
  POINT_LAYER_ID,
} from "../constants";
import { normalizeOperatorName } from "@/lib/operatorUtils";
import { RadioLineTooltipContent } from "../components/radioLineTooltipContent";
import type { DuplexRadioLink } from "../utils";
import { findDuplexLinkByRadioLineId } from "../utils";

type UseRadioLinesLayerArgs = {
  map: maplibregl.Map | null;
  isLoaded: boolean;
  linesGeoJSON: GeoJSON.FeatureCollection;
  endpointsGeoJSON: GeoJSON.FeatureCollection;
  duplexLinks: DuplexRadioLink[];
  minZoom: number;
  onFeatureClick: (link: DuplexRadioLink, coordinates: [number, number]) => void;
};

function createLineLayerConfig(minzoom: number): maplibregl.LayerSpecification {
  return {
    id: RADIOLINES_LINE_LAYER_ID,
    type: "line",
    source: RADIOLINES_SOURCE_ID,
    minzoom,
    paint: {
      "line-color": ["get", "color"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.5, 14, 3, 18, 5],
      "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.4, 13, 0.8],
      "line-dasharray": ["case", ["get", "isExpired"], ["literal", [4, 3]], ["literal", [1, 0]]],
    },
  };
}

function createHitboxLayerConfig(minzoom: number): maplibregl.LayerSpecification {
  return {
    id: RADIOLINES_HITBOX_LAYER_ID,
    type: "line",
    source: RADIOLINES_SOURCE_ID,
    minzoom,
    paint: {
      "line-width": 16,
      "line-opacity": 0,
    },
  };
}

function createEndpointLayerConfig(minzoom: number): maplibregl.LayerSpecification {
  return {
    id: RADIOLINES_ENDPOINT_LAYER_ID,
    type: "circle",
    source: RADIOLINES_ENDPOINTS_SOURCE_ID,
    minzoom,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 14, 4],
      "circle-color": ["get", "color"],
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
    },
  };
}

const HITBOX_LAYERS = [RADIOLINES_HITBOX_LAYER_ID, RADIOLINES_ENDPOINT_LAYER_ID] as const;
const ALL_LAYERS = [RADIOLINES_LINE_LAYER_ID, RADIOLINES_HITBOX_LAYER_ID, RADIOLINES_ENDPOINT_LAYER_ID] as const;

export function useRadioLinesLayer({ map, isLoaded, linesGeoJSON, endpointsGeoJSON, duplexLinks, minZoom, onFeatureClick }: UseRadioLinesLayerArgs) {
  const callbackRefs = useRef({ onFeatureClick });
  const linesRef = useRef(linesGeoJSON);
  const endpointsRef = useRef(endpointsGeoJSON);
  const duplexLinksRef = useRef(duplexLinks);

  useEffect(() => {
    callbackRefs.current = { onFeatureClick };
    linesRef.current = linesGeoJSON;
    endpointsRef.current = endpointsGeoJSON;
    duplexLinksRef.current = duplexLinks;
  }, [onFeatureClick, linesGeoJSON, endpointsGeoJSON, duplexLinks]);

  const tooltipRef = useRef<maplibregl.Popup | null>(null);
  const tooltipContainerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRootRef = useRef<ReturnType<typeof createRoot> | null>(null);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const ensureLayersExist = () => {
      if (!map) return;

      const beforeLayer = map.getLayer(POINT_LAYER_ID) ? POINT_LAYER_ID : undefined;

      if (!map.getSource(RADIOLINES_SOURCE_ID)) map.addSource(RADIOLINES_SOURCE_ID, { type: "geojson", data: linesRef.current });
      if (!map.getSource(RADIOLINES_ENDPOINTS_SOURCE_ID))
        map.addSource(RADIOLINES_ENDPOINTS_SOURCE_ID, { type: "geojson", data: endpointsRef.current });

      if (!map.getLayer(RADIOLINES_LINE_LAYER_ID)) map.addLayer(createLineLayerConfig(minZoom), beforeLayer);
      if (!map.getLayer(RADIOLINES_HITBOX_LAYER_ID)) map.addLayer(createHitboxLayerConfig(minZoom), beforeLayer);
      if (!map.getLayer(RADIOLINES_ENDPOINT_LAYER_ID)) map.addLayer(createEndpointLayerConfig(minZoom), beforeLayer);
    };

    const isNearStation = (point: maplibregl.Point) => {
      const stationLayers = [POINT_LAYER_ID, `${POINT_LAYER_ID}-symbol`].filter((id) => map.getLayer(id));
      if (stationLayers.length === 0) return false;
      const tolerance = 12;
      const bbox: [maplibregl.PointLike, maplibregl.PointLike] = [
        [point.x - tolerance, point.y - tolerance],
        [point.x + tolerance, point.y + tolerance],
      ];
      return map.queryRenderedFeatures(bbox, { layers: stationLayers }).length > 0;
    };

    const handleClick = (e: maplibregl.MapLayerMouseEvent) => {
      if (isNearStation(e.point)) return;

      const feature = e.features?.[0];
      const radioLineId = feature?.properties?.radioLineId;
      if (!radioLineId) return;

      const link = findDuplexLinkByRadioLineId(radioLineId, duplexLinksRef.current);
      if (!link) return;

      tooltipRef.current?.remove();
      tooltipRef.current = null;

      callbackRefs.current.onFeatureClick(link, [e.lngLat.lng, e.lngLat.lat]);
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const handleMouseMove = (e: maplibregl.MapLayerMouseEvent) => {
      if (isNearStation(e.point)) {
        tooltipRef.current?.remove();
        tooltipRef.current = null;
        return;
      }

      const props = e.features?.[0]?.properties;
      if (!props) {
        tooltipRef.current?.remove();
        tooltipRef.current = null;
        return;
      }

      const color = props.color || "#3b82f6";
      const operator = props.operatorName || "";
      const distance = props.distanceFormatted || "";
      const directionCount = props.directionCount ?? 1;
      if (!operator) return;

      let directions: { freq: string; bandwidth: string | null; forward: boolean }[] = [];
      try {
        directions = JSON.parse(props.directionsJson || "[]");
      } catch {
        // ignore
      }

      if (!tooltipRef?.current) {
        const container = document.createElement("div");
        tooltipContainerRef.current = container as HTMLDivElement;
        tooltipRootRef.current = createRoot(container);
        tooltipRef.current = new MapLibreGL.Popup({
          closeButton: false,
          closeOnClick: false,
          className: "radioline-tooltip",
          maxWidth: "20rem",
          offset: 10,
        }).setDOMContent(container);
      }

      tooltipRootRef.current?.render(
        <RadioLineTooltipContent
          color={color}
          operatorName={normalizeOperatorName(operator)}
          distanceFormatted={distance}
          directions={directions}
          directionCount={directionCount}
        />,
      );
      tooltipRef.current.setLngLat(e.lngLat).addTo(map);
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      tooltipRef.current?.remove();
      tooltipRef.current = null;
    };

    ensureLayersExist();
    map.on("styledata", ensureLayersExist);

    for (const layerId of HITBOX_LAYERS) {
      map.on("click", layerId, handleClick);
      map.on("mouseenter", layerId, handleMouseEnter);
      map.on("mousemove", layerId, handleMouseMove);
      map.on("mouseleave", layerId, handleMouseLeave);
    }

    return () => {
      const isMapValid = map.getStyle() !== undefined;

      tooltipRef.current?.remove();
      tooltipRef.current = null;
      tooltipRootRef.current?.unmount();
      tooltipRootRef.current = null;
      tooltipContainerRef.current = null;

      if (isMapValid) {
        map.off("styledata", ensureLayersExist);

        for (const layerId of HITBOX_LAYERS) {
          map.off("click", layerId, handleClick);
          map.off("mouseenter", layerId, handleMouseEnter);
          map.off("mousemove", layerId, handleMouseMove);
          map.off("mouseleave", layerId, handleMouseLeave);
        }

        for (const layerId of ALL_LAYERS) {
          try {
            map.removeLayer(layerId);
          } catch (_) {
            // layer may already be removed
          }
        }
        for (const sourceId of [RADIOLINES_SOURCE_ID, RADIOLINES_ENDPOINTS_SOURCE_ID]) {
          try {
            map.removeSource(sourceId);
          } catch (_) {
            // source may already be removed
          }
        }
      }
    };
  }, [map, isLoaded, minZoom]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const linesSource = map.getSource(RADIOLINES_SOURCE_ID) as MapLibreGL.GeoJSONSource | undefined;
    if (linesSource) linesSource.setData(linesGeoJSON);

    const endpointsSource = map.getSource(RADIOLINES_ENDPOINTS_SOURCE_ID) as MapLibreGL.GeoJSONSource | undefined;
    if (endpointsSource) endpointsSource.setData(endpointsGeoJSON);
  }, [map, isLoaded, linesGeoJSON, endpointsGeoJSON]);
}
