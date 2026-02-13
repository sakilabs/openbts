import { useEffect, useRef } from "react";
import type { StationFilters, StationSource } from "@/types/station";

type UseUrlSyncArgs = {
	map: maplibregl.Map | null;
	isLoaded: boolean;
	filters: StationFilters;
	zoom: number;
	onInitialize: (data: {
		filters: StationFilters;
		center?: [number, number];
		zoom?: number;
		stationId?: number;
		locationId?: number;
		ukeStationId?: string;
	}) => void;
};

function parseUrlHash(): {
	filters: Partial<StationFilters>;
	center?: [number, number];
	zoom?: number;
	stationId?: number;
	locationId?: number;
	ukeStationId?: string;
} {
	const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
	if (!hash.startsWith("map=")) {
		return { filters: {} };
	}

	const [mapPart, queryPart = ""] = hash.split("?");
	const mapValue = mapPart.replace("map=", "");
	const [zStr, latStr, lngStr] = mapValue.split("/");

	const z = Number.parseFloat(zStr || "");
	const lat = Number.parseFloat(latStr || "");
	const lng = Number.parseFloat(lngStr || "");

	const params = new URLSearchParams(queryPart);

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
	const recentOnly = params.get("new") === "true";
	const showRadiolines = params.get("radiolines") === "1";
	const showStations = params.get("stations") !== "0";

	const stationIdStr = params.get("station");
	const stationId = stationIdStr ? Number.parseInt(stationIdStr, 10) : undefined;

	const locationIdStr = params.get("location");
	const locationId = locationIdStr ? Number.parseInt(locationIdStr, 10) : undefined;

	const ukeStationId = params.get("uke_station") || undefined;

	return {
		filters: { operators, bands, rat, source, recentOnly, showStations, showRadiolines },
		center: !Number.isNaN(lat) && !Number.isNaN(lng) ? [lng, lat] : undefined,
		zoom: !Number.isNaN(z) ? z : undefined,
		stationId: stationId && !Number.isNaN(stationId) ? stationId : undefined,
		locationId: locationId && !Number.isNaN(locationId) ? locationId : undefined,
		ukeStationId,
	};
}

function buildUrlHash(filters: StationFilters, map: maplibregl.Map, zoomOverride?: number): string {
	const params = new URLSearchParams();

	if (filters.operators.length > 0) params.set("operators", filters.operators.join(","));
	if (filters.bands.length > 0) params.set("bands", filters.bands.join(","));
	if (filters.rat.length > 0) params.set("rat", filters.rat.join(","));
	params.set("source", filters.source);
	if (filters.recentOnly) params.set("new", "true");
	if (filters.showRadiolines) params.set("radiolines", "1");
	if (!filters.showStations) params.set("stations", "0");

	const center = map.getCenter();
	const zoom = zoomOverride ?? map.getZoom();

	const mapPart = `map=${zoom.toFixed(2)}/${center.lat.toFixed(6)}/${center.lng.toFixed(6)}`;
	const query = params.toString();

	return `#${mapPart}${query ? `?${query}` : ""}`;
}

export function useUrlSync({ map, isLoaded, filters, zoom, onInitialize }: UseUrlSyncArgs) {
	const isInitialized = useRef(false);

	useEffect(() => {
		if (!isLoaded || !map || isInitialized.current) return;

		const { filters: urlFilters, center, zoom: urlZoom, stationId, locationId, ukeStationId } = parseUrlHash();

		if (center || urlZoom !== undefined) {
			map.flyTo({
				center: center ?? map.getCenter(),
				zoom: urlZoom ?? map.getZoom(),
				essential: true,
			});
		}

		onInitialize({
			filters: {
				operators: urlFilters.operators || [],
				bands: urlFilters.bands || [],
				rat: urlFilters.rat || [],
				source: urlFilters.source || "internal",
				recentOnly: urlFilters.recentOnly || false,
				showStations: urlFilters.showStations ?? true,
				showRadiolines: urlFilters.showRadiolines ?? false,
			},
			center,
			zoom: urlZoom,
			stationId,
			locationId,
			ukeStationId,
		});

		isInitialized.current = true;
	}, [isLoaded, map, onInitialize]);

	useEffect(() => {
		if (!isLoaded || !map || !isInitialized.current) return;

		const newUrl = `${window.location.pathname}${buildUrlHash(filters, map, zoom)}`;
		window.history.replaceState(null, "", newUrl);
	}, [filters, isLoaded, map, zoom]);
}
