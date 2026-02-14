import { useEffect, useRef } from "react";
import MapLibreGL from "maplibre-gl";
import {
	RADIOLINES_SOURCE_ID,
	RADIOLINES_ENDPOINTS_SOURCE_ID,
	RADIOLINES_LINE_LAYER_ID,
	RADIOLINES_HITBOX_LAYER_ID,
	RADIOLINES_ENDPOINT_LAYER_ID,
	POINT_LAYER_ID,
} from "../constants";
import type { RadioLine } from "@/types/station";
import { normalizeOperatorName } from "@/lib/operatorUtils";

type UseRadioLinesLayerArgs = {
	map: maplibregl.Map | null;
	isLoaded: boolean;
	linesGeoJSON: GeoJSON.FeatureCollection;
	endpointsGeoJSON: GeoJSON.FeatureCollection;
	radioLines: RadioLine[];
	minZoom: number;
	onFeatureClick: (radioLine: RadioLine, coordinates: [number, number]) => void;
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

export function useRadioLinesLayer({ map, isLoaded, linesGeoJSON, endpointsGeoJSON, radioLines, minZoom, onFeatureClick }: UseRadioLinesLayerArgs) {
	const callbackRefs = useRef({ onFeatureClick });
	callbackRefs.current = { onFeatureClick };

	const linesRef = useRef(linesGeoJSON);
	linesRef.current = linesGeoJSON;

	const endpointsRef = useRef(endpointsGeoJSON);
	endpointsRef.current = endpointsGeoJSON;

	const radioLinesRef = useRef(radioLines);
	radioLinesRef.current = radioLines;

	const tooltipRef = useRef<maplibregl.Popup | null>(null);

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

			const rl = radioLinesRef.current.find((r) => r.id === radioLineId);
			if (!rl) return;

			tooltipRef.current?.remove();
			tooltipRef.current = null;

			callbackRefs.current.onFeatureClick(rl, [e.lngLat.lng, e.lngLat.lat]);
		};

		const handleMouseEnter = (e: maplibregl.MapLayerMouseEvent) => {
			if (isNearStation(e.point)) return;
			map.getCanvas().style.cursor = "pointer";
		};

		const handleMouseMove = (e: maplibregl.MapLayerMouseEvent) => {
			if (isNearStation(e.point)) {
				tooltipRef.current?.remove();
				tooltipRef.current = null;
				map.getCanvas().style.cursor = "";
				return;
			}

			const props = e.features?.[0]?.properties;
			if (!props) {
				tooltipRef.current?.remove();
				tooltipRef.current = null;
				return;
			}

			const color = props.color || "#3b82f6";
			const freq = props.freqFormatted || "";
			const operator = props.operatorName || "";
			const distance = props.distanceFormatted || "";
			if (!freq && !operator) return;

			const html = `<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;">
				<span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></span>
				<span style="font-size:12px;font-weight:500;white-space:nowrap;">${[freq, normalizeOperatorName(operator), distance].filter(Boolean).join(" · ")}</span>
			</div>`;

			if (!tooltipRef.current) {
				tooltipRef.current = new MapLibreGL.Popup({
					closeButton: false,
					closeOnClick: false,
					className: "radioline-tooltip",
					offset: 10,
				});
			}

			tooltipRef.current.setLngLat(e.lngLat).setHTML(html).addTo(map);
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

			if (isMapValid) {
				map.off("styledata", ensureLayersExist);

				for (const layerId of HITBOX_LAYERS) {
					map.off("click", layerId, handleClick);
					map.off("mouseenter", layerId, handleMouseEnter);
					map.off("mousemove", layerId, handleMouseMove);
					map.off("mouseleave", layerId, handleMouseLeave);
				}

				try {
					for (const layerId of ALL_LAYERS) {
						if (map.getLayer(layerId)) map.removeLayer(layerId);
					}
					if (map.getSource(RADIOLINES_SOURCE_ID)) map.removeSource(RADIOLINES_SOURCE_ID);
					if (map.getSource(RADIOLINES_ENDPOINTS_SOURCE_ID)) map.removeSource(RADIOLINES_ENDPOINTS_SOURCE_ID);
				} catch {}
			}
		};
	}, [map, isLoaded]);

	useEffect(() => {
		if (!map || !isLoaded) return;

		const linesSource = map.getSource(RADIOLINES_SOURCE_ID) as MapLibreGL.GeoJSONSource | undefined;
		if (linesSource) linesSource.setData(linesGeoJSON);

		const endpointsSource = map.getSource(RADIOLINES_ENDPOINTS_SOURCE_ID) as MapLibreGL.GeoJSONSource | undefined;
		if (endpointsSource) endpointsSource.setData(endpointsGeoJSON);
	}, [map, isLoaded, linesGeoJSON, endpointsGeoJSON]);
}
