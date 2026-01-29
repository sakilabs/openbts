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

type UseMapLayerArgs = {
	map: maplibregl.Map | null;
	isLoaded: boolean;
	geoJSON: GeoJSON.FeatureCollection;
	onFeatureClick: (data: FeatureClickData) => void;
	onFeatureMouseDown?: (locationId: number) => void;
};

function makePieImageData(segments: { value: number; color: string }[], size = 32): ImageData | null {
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;

	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) return null;

	const r = size / 2;
	const cx = r,
		cy = r;

	const fillRadius = 12;
	const strokeCenterRadius = 14;
	const actualStrokeWidth = 4;

	const total = segments.reduce((s, x) => s + x.value, 0) || 1;

	let a0 = -Math.PI / 2;
	for (const seg of segments) {
		const a1 = a0 + (seg.value / total) * Math.PI * 2;
		ctx.beginPath();
		ctx.moveTo(cx, cy);
		ctx.arc(cx, cy, fillRadius + 0.5, a0, a1);
		ctx.closePath();
		ctx.fillStyle = seg.color;
		ctx.fill();
		a0 = a1;
	}

	ctx.beginPath();
	ctx.arc(cx, cy, strokeCenterRadius, 0, Math.PI * 2);
	ctx.strokeStyle = "#fff";
	ctx.lineWidth = actualStrokeWidth;
	ctx.stroke();

	return ctx.getImageData(0, 0, size, size);
}

const SYMBOL_LAYER_ID = `${POINT_LAYER_ID}-symbol`;
const LAYER_IDS = [POINT_LAYER_ID, SYMBOL_LAYER_ID];

const CIRCLE_LAYER_CONFIG = {
	id: POINT_LAYER_ID,
	type: "circle" as const,
	source: SOURCE_ID,
	filter: ["!", ["get", "isMultiOperator"]],
	paint: {
		"circle-color": ["get", "color"],
		"circle-radius": 6,
		"circle-stroke-width": 2,
		"circle-stroke-color": "#fff",
	},
};

const SYMBOL_LAYER_CONFIG = {
	id: SYMBOL_LAYER_ID,
	type: "symbol" as const,
	source: SOURCE_ID,
	filter: ["get", "isMultiOperator"],
	layout: {
		"icon-image": ["get", "pieImageId"],
		"icon-size": 0.5,
		"icon-allow-overlap": true,
	},
};

export function useMapLayer({ map, isLoaded, geoJSON, onFeatureClick, onFeatureMouseDown }: UseMapLayerArgs) {
	const onFeatureClickRef = useRef(onFeatureClick);
	onFeatureClickRef.current = onFeatureClick;
	const onFeatureMouseDownRef = useRef(onFeatureMouseDown);
	onFeatureMouseDownRef.current = onFeatureMouseDown;
	const addedImagesRef = useRef(new Set<string>());

	useEffect(() => {
		if (!map || !isLoaded) return;

		if (!map.getSource(SOURCE_ID)) map.addSource(SOURCE_ID, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
		if (!map.getLayer(POINT_LAYER_ID)) map.addLayer(CIRCLE_LAYER_CONFIG as maplibregl.LayerSpecification);
		if (!map.getLayer(SYMBOL_LAYER_ID)) map.addLayer(SYMBOL_LAYER_CONFIG as maplibregl.LayerSpecification);

		addedImagesRef.current.clear();

		const handleMouseDown = (e: maplibregl.MapMouseEvent) => {
			if (!onFeatureMouseDownRef.current) return;

			const features = map.queryRenderedFeatures(e.point, { layers: LAYER_IDS });
			if (!features.length) return;

			const feature = features[0];
			const locationId = feature.properties?.locationId;
			if (!locationId) return;

			onFeatureMouseDownRef.current(locationId);
		};

		const handleClick = (e: maplibregl.MapMouseEvent) => {
			const features = map.queryRenderedFeatures(e.point, { layers: LAYER_IDS });
			if (!features.length) return;

			const feature = features[0];
			if (feature.geometry.type !== "Point") return;

			const locationId = feature.properties?.locationId;
			if (!locationId) return;

			onFeatureClickRef.current({
				coordinates: feature.geometry.coordinates as [number, number],
				locationId,
				city: feature.properties?.city,
				address: feature.properties?.address,
				source: feature.properties?.source || "internal",
			});
		};

		const handleMouseEnter = () => {
			map.getCanvas().style.cursor = "pointer";
		};
		const handleMouseLeave = () => {
			map.getCanvas().style.cursor = "";
		};

		for (const id of LAYER_IDS) {
			map.on("mousedown", id, handleMouseDown);
			map.on("click", id, handleClick);
			map.on("mouseenter", id, handleMouseEnter);
			map.on("mouseleave", id, handleMouseLeave);
		}

		return () => {
			for (const id of LAYER_IDS) {
				map.off("mousedown", id, handleMouseDown);
				map.off("click", id, handleClick);
				map.off("mouseenter", id, handleMouseEnter);
				map.off("mouseleave", id, handleMouseLeave);
			}

			try {
				for (const id of LAYER_IDS) {
					if (map.getLayer(id)) map.removeLayer(id);
				}
				if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
			} catch {}

			addedImagesRef.current.clear();
		};
	}, [map, isLoaded]);

	useEffect(() => {
		if (!map || !isLoaded) return;

		const source = map.getSource(SOURCE_ID) as MapLibreGL.GeoJSONSource;
		if (!source) return;

		for (const feature of geoJSON.features) {
			const pieImageId = feature.properties?.pieImageId;
			if (pieImageId && !addedImagesRef.current.has(pieImageId)) {
				if (!map.hasImage(pieImageId)) {
					const mncs = JSON.parse(feature.properties?.operators || "[]") as number[];
					const segments = mncs.map((mnc) => ({
						value: 1,
						color: getOperatorColor(mnc),
					}));
					const imageData = makePieImageData(segments);
					if (imageData) map.addImage(pieImageId, imageData);
				}
				addedImagesRef.current.add(pieImageId);
			}
		}

		source.setData(geoJSON);
	}, [map, isLoaded, geoJSON]);
}
