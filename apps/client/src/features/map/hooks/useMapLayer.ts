import { useEffect, useRef } from "react";
import type MapLibreGL from "maplibre-gl";
import { POINT_LAYER_ID, SOURCE_ID } from "../constants";
import { syncPieImages } from "../pieChart";

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
};

const SYMBOL_LAYER_ID = `${POINT_LAYER_ID}-symbol`;
const LAYER_IDS = [POINT_LAYER_ID, SYMBOL_LAYER_ID] as const;

const CIRCLE_LAYER_CONFIG: maplibregl.LayerSpecification = {
	id: POINT_LAYER_ID,
	type: "circle",
	source: SOURCE_ID,
	filter: ["!", ["get", "isMultiOperator"]],
	paint: {
		"circle-color": ["get", "color"],
		"circle-radius": 6,
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

export function useMapLayer({ map, isLoaded, geoJSON, onFeatureClick, onFeatureContextMenu, onFeatureMouseDown }: UseMapLayerArgs) {
	const callbackRefs = useRef({ onFeatureClick, onFeatureContextMenu, onFeatureMouseDown });
	callbackRefs.current = { onFeatureClick, onFeatureContextMenu, onFeatureMouseDown };

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

			if (!map.getLayer(POINT_LAYER_ID)) map.addLayer(CIRCLE_LAYER_CONFIG);
			if (!map.getLayer(SYMBOL_LAYER_ID)) map.addLayer(SYMBOL_LAYER_CONFIG);

			syncPieImages(map, geoJSONRef.current.features, addedImagesRef.current);
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

		const handleMouseEnter = () => {
			map.getCanvas().style.cursor = "pointer";
		};

		const handleMouseLeave = () => {
			map.getCanvas().style.cursor = "";
		};

		ensureLayersExist();
		map.on("styledata", ensureLayersExist);

		for (const layerId of LAYER_IDS) {
			map.on("mousedown", layerId, handleMouseDown);
			map.on("click", layerId, handleClick);
			map.on("contextmenu", layerId, handleContextMenu);
			map.on("mouseenter", layerId, handleMouseEnter);
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
		};
	}, [map, isLoaded]);

	useEffect(() => {
		if (!map || !isLoaded) return;

		const source = map.getSource(SOURCE_ID) as MapLibreGL.GeoJSONSource | undefined;
		if (!source) return;

		syncPieImages(map, geoJSON.features, addedImagesRef.current);
		source.setData(geoJSON);
	}, [map, isLoaded, geoJSON]);
}
