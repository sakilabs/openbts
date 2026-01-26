"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMap } from "@/components/ui/map";
import { MapSearchOverlay } from "./search-overlay";
import { StationDetailsDialog } from "@/features/station-details/components/station-details-dialog";
import type { StationFilters, StationSource } from "@/types/station";
import { fetchStations } from "../api";
import { stationsToGeoJSON } from "../geojson";
import { useUrlSync } from "../hooks/use-url-sync";
import { useMapPopup } from "../hooks/use-map-popup";
import { useMapLayer } from "../hooks/use-map-layer";
import { useMapBounds } from "../hooks/use-map-bounds";

const DEFAULT_FILTERS: StationFilters = {
	operators: [],
	bands: [],
	rat: [],
	source: "internal",
};

export function StationsLayer() {
	const { map, isLoaded } = useMap();

	const [filters, setFilters] = useState<StationFilters>(DEFAULT_FILTERS);
	const [selectedStation, setSelectedStation] = useState<{
		id: number;
		source: StationSource;
	} | null>(null);

	const { bounds, zoom, isMoving } = useMapBounds({ map, isLoaded });

	useUrlSync({
		map,
		isLoaded,
		filters,
		zoom,
		onInitialize: useCallback(({ filters: urlFilters }) => {
			setFilters(urlFilters);
		}, []),
	});

	const { showPopup, cleanup: cleanupPopup } = useMapPopup({
		map,
		onOpenDetails: useCallback((id, source) => {
			setSelectedStation({ id, source });
		}, []),
	});

	const {
		data: stations = [],
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: ["stations", bounds, filters],
		queryFn: () => fetchStations(bounds, filters),
		enabled: !!bounds && !isMoving,
		staleTime: 1000 * 60 * 2,
		placeholderData: (prev) => prev,
	});

	const geoJSON = useMemo(() => stationsToGeoJSON(stations, filters.source), [stations, filters.source]);

	useMapLayer({
		map,
		isLoaded,
		geoJSON,
		onFeatureClick: useCallback(
			(coordinates, stationsData, source) => {
				showPopup(coordinates, stationsData, source as StationSource);
			},
			[showPopup],
		),
	});

	useEffect(() => cleanupPopup, [cleanupPopup]);

	function handleLocationSelect(lat: number, lng: number) {
		map?.flyTo({ center: [lng, lat], zoom: 15, essential: true });
	}

	function handleStationSelect(station: any) {
		if (!map) return;

		const lat = station.location?.latitude ?? station.latitude;
		const lng = station.location?.longitude ?? station.longitude;
		if (lat === undefined || lng === undefined) return;

		map.flyTo({ center: [lng, lat], zoom: 16, essential: true });

		const colocated = stations.filter((s: any) => {
			const sLat = s.location?.latitude ?? s.latitude;
			const sLng = s.location?.longitude ?? s.longitude;
			return sLat.toFixed(6) === lat.toFixed(6) && sLng.toFixed(6) === lng.toFixed(6);
		});

		if (!colocated.some((s: any) => s.id === station.id)) colocated.push(station);

		showPopup([lng, lat], colocated, filters.source);
	}

	if (!isLoaded) return null;

	return (
		<>
			<MapSearchOverlay
				stationCount={stations.length}
				isLoading={isLoading}
				isFetching={isFetching}
				filters={filters}
				zoom={zoom}
				onFiltersChange={setFilters}
				onLocationSelect={handleLocationSelect}
				onStationSelect={handleStationSelect}
			/>
			<StationDetailsDialog
				key={selectedStation?.id}
				stationId={selectedStation?.id ?? null}
				source={selectedStation?.source ?? "internal"}
				onClose={() => setSelectedStation(null)}
			/>
		</>
	);
}
