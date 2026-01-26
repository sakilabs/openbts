import { useEffect, useRef } from "react";
import type MapLibreGL from "maplibre-gl";
import { POINT_LAYER_ID, SOURCE_ID } from "../constants";
import type { Station } from "@/types/station";

type UseMapLayerArgs = {
	map: maplibregl.Map | null;
	isLoaded: boolean;
	geoJSON: GeoJSON.FeatureCollection;
	onFeatureClick: (coordinates: [number, number], stations: Station[], source: string) => void;
};

const LAYER_CONFIG = {
	id: POINT_LAYER_ID,
	type: "circle" as const,
	source: SOURCE_ID,
	paint: {
		"circle-color": ["get", "color"],
		"circle-radius": ["case", ["get", "isMultiOperator"], 7, 6],
		"circle-stroke-width": ["case", ["get", "isMultiOperator"], 3, 2],
		"circle-stroke-color": "#fff",
	},
};

export function useMapLayer({ map, isLoaded, geoJSON, onFeatureClick }: UseMapLayerArgs) {
	const layersAddedRef = useRef(false);
	const onFeatureClickRef = useRef(onFeatureClick);
	onFeatureClickRef.current = onFeatureClick;

	useEffect(() => {
		if (!map || !isLoaded || layersAddedRef.current) return;

		map.addSource(SOURCE_ID, { type: "geojson", data: geoJSON });
		map.addLayer(LAYER_CONFIG as maplibregl.LayerSpecification);
		layersAddedRef.current = true;

		const handleClick = (e: maplibregl.MapMouseEvent) => {
			const features = map.queryRenderedFeatures(e.point, { layers: [POINT_LAYER_ID] });
			if (!features.length) return;

			const feature = features[0];
			if (feature.geometry.type !== "Point") return;

			const stations = JSON.parse(feature.properties?.stations || "[]");
			if (!stations.length) return;

			const source = feature.properties?.source || "internal";
			onFeatureClickRef.current(feature.geometry.coordinates as [number, number], stations, source);
		};

		const handleMouseEnter = () => {
			map.getCanvas().style.cursor = "pointer";
		};
		const handleMouseLeave = () => {
			map.getCanvas().style.cursor = "";
		};

		map.on("click", POINT_LAYER_ID, handleClick);
		map.on("mouseenter", POINT_LAYER_ID, handleMouseEnter);
		map.on("mouseleave", POINT_LAYER_ID, handleMouseLeave);

		return () => {
			map.off("click", POINT_LAYER_ID, handleClick);
			map.off("mouseenter", POINT_LAYER_ID, handleMouseEnter);
			map.off("mouseleave", POINT_LAYER_ID, handleMouseLeave);

			try {
				if (map.getLayer(POINT_LAYER_ID)) map.removeLayer(POINT_LAYER_ID);
				if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
			} catch {}
			layersAddedRef.current = false;
		};
	}, [map, isLoaded, geoJSON]);

	useEffect(() => {
		if (!map || !isLoaded || !layersAddedRef.current) return;

		const source = map.getSource(SOURCE_ID) as MapLibreGL.GeoJSONSource;
		source?.setData(geoJSON);
	}, [map, isLoaded, geoJSON]);
}
