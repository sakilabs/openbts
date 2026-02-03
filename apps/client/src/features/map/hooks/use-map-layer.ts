import { useEffect, useRef } from "react";
import type MapLibreGL from "maplibre-gl";
import { POINT_LAYER_ID, SOURCE_ID } from "../constants";
import { getOperatorColor } from "@/lib/operator-utils";

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

const PIE_IMAGE_SIZE = 32;
const PIE_FILL_RADIUS = 12;
const PIE_STROKE_RADIUS = 14;
const PIE_STROKE_WIDTH = 4;

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

function createPieChartImage(segments: { value: number; color: string }[]): ImageData | null {
	const canvas = document.createElement("canvas");
	canvas.width = PIE_IMAGE_SIZE;
	canvas.height = PIE_IMAGE_SIZE;

	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) return null;

	const center = PIE_IMAGE_SIZE / 2;
	const total = segments.reduce((sum, seg) => sum + seg.value, 0) || 1;

	let startAngle = -Math.PI / 2;
	for (const { value, color } of segments) {
		const endAngle = startAngle + (value / total) * Math.PI * 2;
		ctx.beginPath();
		ctx.moveTo(center, center);
		ctx.arc(center, center, PIE_FILL_RADIUS + 0.5, startAngle, endAngle);
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();
		startAngle = endAngle;
	}

	ctx.beginPath();
	ctx.arc(center, center, PIE_STROKE_RADIUS, 0, Math.PI * 2);
	ctx.strokeStyle = "#fff";
	ctx.lineWidth = PIE_STROKE_WIDTH;
	ctx.stroke();

	return ctx.getImageData(0, 0, PIE_IMAGE_SIZE, PIE_IMAGE_SIZE);
}

function parseOperators(operatorsJson: string | undefined): number[] {
	try {
		return JSON.parse(operatorsJson || "[]");
	} catch {
		return [];
	}
}

function createOperatorSegments(operators: number[]) {
	return operators.map((mnc) => ({
		value: 1,
		color: getOperatorColor(mnc),
	}));
}

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

function addPieImageToMap(map: maplibregl.Map, pieImageId: string, operators: number[], addedImages: Set<string>): void {
	if (map.hasImage(pieImageId)) {
		addedImages.add(pieImageId);
		return;
	}

	const segments = createOperatorSegments(operators);
	const imageData = createPieChartImage(segments);

	if (imageData) {
		map.addImage(pieImageId, imageData);
		addedImages.add(pieImageId);
	}
}

function syncPieImages(map: maplibregl.Map, features: GeoJSON.Feature[], addedImages: Set<string>): void {
	for (const feature of features) {
		const pieImageId = feature.properties?.pieImageId;
		if (!pieImageId || addedImages.has(pieImageId)) continue;

		const operators = parseOperators(feature.properties?.operators);
		addPieImageToMap(map, pieImageId, operators, addedImages);
	}
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
