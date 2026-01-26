import { useEffect, useRef } from "react";
import type { StationFilters, StationSource } from "@/types/station";

type UseUrlSyncArgs = {
	map: maplibregl.Map | null;
	isLoaded: boolean;
	filters: StationFilters;
	zoom: number;
	onInitialize: (data: { filters: StationFilters; center?: [number, number]; zoom?: number }) => void;
};

function parseUrlFilters(): {
	filters: Partial<StationFilters>;
	center?: [number, number];
	zoom?: number;
} {
	const params = new URLSearchParams(window.location.search);

	const lat = Number.parseFloat(params.get("lat") || "");
	const lng = Number.parseFloat(params.get("lng") || "");
	const z = Number.parseFloat(params.get("zoom") || "");

	const operators =
		params
			.get("operators")
			?.split(",")
			.map(Number)
			.filter((n) => !Number.isNaN(n)) || [];
	const bands =
		params
			.get("bands")
			?.split(",")
			.map(Number)
			.filter((n) => !Number.isNaN(n)) || [];
	const rat = params.get("rat")?.split(",").filter(Boolean) || [];
	const source = (params.get("source") as StationSource) || "internal";

	return {
		filters: { operators, bands, rat, source },
		center: !Number.isNaN(lat) && !Number.isNaN(lng) ? [lng, lat] : undefined,
		zoom: !Number.isNaN(z) ? z : undefined,
	};
}

function buildUrlParams(filters: StationFilters, map: maplibregl.Map): string {
	const params = new URLSearchParams();

	if (filters.operators.length > 0) params.set("operators", filters.operators.join(","));
	if (filters.bands.length > 0) params.set("bands", filters.bands.join(","));
	if (filters.rat.length > 0) params.set("rat", filters.rat.join(","));
	params.set("source", filters.source);

	const center = map.getCenter();
	params.set("lat", center.lat.toFixed(6));
	params.set("lng", center.lng.toFixed(6));
	params.set("zoom", map.getZoom().toFixed(2));

	return decodeURIComponent(params.toString());
}

export function useUrlSync({ map, isLoaded, filters, zoom, onInitialize }: UseUrlSyncArgs) {
	const isInitialized = useRef(false);

	useEffect(() => {
		if (!isLoaded || !map || isInitialized.current) return;

		const { filters: urlFilters, center, zoom: urlZoom } = parseUrlFilters();

		if (center) map.setCenter(center);
		if (urlZoom !== undefined) map.setZoom(urlZoom);

		onInitialize({
			filters: {
				operators: urlFilters.operators || [],
				bands: urlFilters.bands || [],
				rat: urlFilters.rat || [],
				source: urlFilters.source || "internal",
			},
			center,
			zoom: urlZoom,
		});

		isInitialized.current = true;
	}, [isLoaded, map, onInitialize]);

	useEffect(() => {
		if (!isLoaded || !map || !isInitialized.current) return;

		const newUrl = `${window.location.pathname}?${buildUrlParams(filters, map)}`;
		window.history.replaceState(null, "", newUrl);
	}, [filters, isLoaded, map, zoom]);
}
