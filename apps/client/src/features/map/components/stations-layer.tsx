"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMap } from "@/components/ui/map";
import { MapSearchOverlay } from "./search-overlay";
import { StationDetailsDialog } from "@/features/station-details/components/station-details-dialog";
import type { StationFilters, StationSource, LocationWithStations, LocationInfo, StationWithoutCells } from "@/types/station";
import { fetchLocations, fetchLocationWithStations, type LocationsResponse } from "../api";
import { locationsToGeoJSON, stationsToGeoJSON } from "../geojson";
import { useUrlSync } from "../hooks/use-url-sync";
import { useMapPopup } from "../hooks/use-map-popup";
import { useMapLayer } from "../hooks/use-map-layer";
import { useMapBounds } from "../hooks/use-map-bounds";
import { ApiResponseError } from "@/lib/api";

const DEFAULT_FILTERS: StationFilters = {
	operators: [],
	bands: [],
	rat: [],
	source: "internal",
};

type PrefetchCache = Map<
	number,
	{
		promise: Promise<LocationWithStations>;
		data?: LocationWithStations;
	}
>;

function showApiError(error: unknown) {
	if (error instanceof ApiResponseError) {
		for (const err of error.errors) {
			toast.error(err.message || err.code);
		}
	} else if (error instanceof Error) {
		toast.error(error.message);
	} else {
		toast.error("An unexpected error occurred");
	}
}

function toLocationInfo(loc: LocationWithStations): LocationInfo {
	return {
		id: loc.id,
		city: loc.city,
		address: loc.address,
		latitude: loc.latitude,
		longitude: loc.longitude,
	};
}

export function StationsLayer() {
	const { map, isLoaded } = useMap();
	const [filters, setFilters] = useState<StationFilters>(DEFAULT_FILTERS);
	const [selectedStation, setSelectedStation] = useState<{ id: number; source: StationSource } | null>(null);
	const { bounds, zoom, isMoving } = useMapBounds({ map, isLoaded });

	useUrlSync({
		map,
		isLoaded,
		filters,
		zoom,
		onInitialize: useCallback(({ filters: urlFilters }) => setFilters(urlFilters), []),
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: This has to be "re-created" when filters change
	const prefetchCache = useMemo<PrefetchCache>(() => new Map(), [filters]);

	const {
		showPopup,
		updatePopupStations,
		cleanup: cleanupPopup,
	} = useMapPopup({
		map,
		onOpenDetails: useCallback((id, source) => setSelectedStation({ id, source }), []),
	});

	const {
		data: locationsResponse,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: ["locations", bounds, filters],
		queryFn: () => fetchLocations(bounds, filters),
		enabled: !!bounds && !isMoving,
		staleTime: 1000 * 60 * 2,
		placeholderData: (prev) => prev,
	});

	const locations = locationsResponse?.data ?? [];
	const totalCount = locationsResponse?.totalCount ?? 0;

	const locationCount = locations.length;

	const geoJSON = useMemo(() => {
		return filters.source === "uke" ? stationsToGeoJSON(locations as any, filters.source) : locationsToGeoJSON(locations, filters.source);
	}, [locations, filters.source]);

	const fetchAndUpdatePopup = useCallback(
		async (locationId: number, location: LocationInfo, source: StationSource) => {
			const cached = prefetchCache.get(locationId);

			try {
				const data = cached?.data ?? (cached ? await cached.promise : await fetchLocationWithStations(locationId, filters));
				updatePopupStations(toLocationInfo(data), data.stations, source);
			} catch (error) {
				console.error("Failed to fetch station cells:", error);
				showApiError(error);
			}
		},
		[filters, prefetchCache, updatePopupStations],
	);

	const handleFeatureMouseDown = useCallback(
		(locationId: number) => {
			if (filters.source === "uke" || prefetchCache.has(locationId)) return;

			const entry = {
				promise: fetchLocationWithStations(locationId, filters).then((data) => {
					entry.data = data;
					return data;
				}),
				data: undefined as LocationWithStations | undefined,
			};
			prefetchCache.set(locationId, entry);
		},
		[filters, prefetchCache],
	);

	const handleFeatureClick = useCallback(
		async (data: { coordinates: [number, number]; locationId: number; city?: string; address?: string; source: string }) => {
			const { coordinates, locationId, city, address, source } = data;
			const [lng, lat] = coordinates;

			if (source === "uke") {
				const ukeStations = (locations as any[]).filter((s: any) => {
					const sLat = s.location?.latitude ?? s.latitude;
					const sLng = s.location?.longitude ?? s.longitude;
					return sLat?.toFixed(6) === lat.toFixed(6) && sLng?.toFixed(6) === lng.toFixed(6);
				});
				showPopup(coordinates, { id: locationId, city, address, latitude: lat, longitude: lng }, ukeStations, source as StationSource);
				return;
			}

			const locationData = locations.find((loc) => loc.id === locationId);
			const location: LocationInfo = {
				id: locationId,
				city: locationData?.city ?? city,
				address: locationData?.address ?? address,
				latitude: lat,
				longitude: lng,
			};

			showPopup(coordinates, location, locationData?.stations ?? null, source as StationSource);
			await fetchAndUpdatePopup(locationId, location, source as StationSource);
		},
		[locations, showPopup, fetchAndUpdatePopup],
	);

	useMapLayer({
		map,
		isLoaded,
		geoJSON,
		onFeatureClick: handleFeatureClick,
		onFeatureMouseDown: handleFeatureMouseDown,
	});

	useEffect(() => cleanupPopup, [cleanupPopup]);

	const handleLocationSelect = useCallback(
		(lat: number, lng: number) => {
			map?.flyTo({ center: [lng, lat], zoom: 15, essential: true });
		},
		[map],
	);

	const handleStationSelect = useCallback(
		async (station: any) => {
			if (!map) return;

			const lat = station.location?.latitude ?? station.latitude;
			const lng = station.location?.longitude ?? station.longitude;
			if (lat == null || lng == null) return;

			map.flyTo({ center: [lng, lat], zoom: 16, essential: true });

			if (filters.source === "uke") {
				const colocatedStations = (locations as any[]).filter((s: any) => {
					const sLat = s.location?.latitude ?? s.latitude;
					const sLng = s.location?.longitude ?? s.longitude;
					return sLat?.toFixed(6) === lat.toFixed(6) && sLng?.toFixed(6) === lng.toFixed(6);
				});
				if (!colocatedStations.some((s: any) => s.id === station.id)) colocatedStations.push(station);

				const location: LocationInfo = {
					id: station.location?.id ?? station.id,
					city: station.location?.city ?? station.city,
					address: station.location?.address ?? station.address,
					latitude: lat,
					longitude: lng,
				};
				showPopup([lng, lat], location, colocatedStations, filters.source);
				return;
			}

			const locationData = locations.find((loc) => loc.latitude.toFixed(6) === lat.toFixed(6) && loc.longitude.toFixed(6) === lng.toFixed(6));

			if (locationData) {
				const location = toLocationInfo(locationData);
				showPopup([lng, lat], location, locationData.stations as StationWithoutCells[], filters.source);
				await fetchAndUpdatePopup(locationData.id, location, filters.source);
			}
		},
		[map, filters, locations, showPopup, fetchAndUpdatePopup],
	);

	if (!isLoaded) return null;

	return (
		<>
			<MapSearchOverlay
				locationCount={locationCount}
				totalCount={totalCount}
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
