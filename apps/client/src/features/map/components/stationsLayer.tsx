"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMap } from "@/components/ui/map";
import { MapSearchOverlay } from "./search-overlay";

const StationDetailsDialog = lazy(() =>
	import("@/features/station-details/components/stationsDetailsDialog").then((m) => ({ default: m.StationDetailsDialog })),
);
const UkePermitDetailsDialog = lazy(() =>
	import("@/features/station-details/components/ukePermitDetailsDialog").then((m) => ({ default: m.UkePermitDetailsDialog })),
);
import type {
	StationFilters,
	StationSource,
	LocationWithStations,
	LocationInfo,
	StationWithoutCells,
	UkeStation,
	UkeLocationWithPermits,
	Station,
} from "@/types/station";
import { fetchLocations, fetchLocationWithStations } from "../api";
import { fetchStation } from "@/features/station-details/api";
import { locationsToGeoJSON, ukeLocationsToGeoJSON } from "../geojson";
import { groupPermitsByStation } from "../utils";
import { useUrlSync } from "../hooks/useURLSync";
import { useMapPopup } from "../hooks/useMapPopup";
import { useMapLayer } from "../hooks/useMapLayer";
import { useMapBounds } from "../hooks/useMapBounds";
import { showApiError } from "@/lib/api";
import { POINT_LAYER_ID } from "../constants";

const DEFAULT_FILTERS: StationFilters = {
	operators: [],
	bands: [],
	rat: [],
	source: "internal",
	recentOnly: false,
};

type PrefetchCache = Map<
	number,
	{
		promise: Promise<LocationWithStations>;
		data?: LocationWithStations;
	}
>;

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
	const [selectedUkeStation, setSelectedUkeStation] = useState<UkeStation | null>(null);
	const [activeMarker, setActiveMarker] = useState<{ latitude: number; longitude: number } | null>(null);
	const { bounds, zoom, isMoving } = useMapBounds({ map, isLoaded });
	const pendingStationId = useRef<number | null>(null);
	const pendingLocationId = useRef<number | null>(null);
	const pendingUkeLocationId = useRef<number | null>(null);

	const {
		showPopup,
		updatePopupStations,
		cleanup: cleanupPopup,
	} = useMapPopup({
		map,
		onOpenStationDetails: useCallback((id: number, source: StationSource) => setSelectedStation({ id, source }), []),
		onOpenUkeStationDetails: useCallback((station: UkeStation) => setSelectedUkeStation(station), []),
	});

	const handleUrlInitialize = useCallback(
		async ({ filters: urlFilters, stationId, locationId }: { filters: StationFilters; stationId?: number; locationId?: number }) => {
			setFilters(urlFilters);

			if (stationId && map) {
				pendingStationId.current = stationId;
				try {
					const station = await fetchStation(stationId);
					if (station.location?.latitude && station.location?.longitude) {
						map.flyTo({
							center: [station.location.longitude, station.location.latitude],
							zoom: 16,
							essential: true,
						});
						setSelectedStation({ id: stationId, source: "internal" });
					}
				} catch (error) {
					console.error("Failed to fetch shared station:", error);
					showApiError(error);
				} finally {
					pendingStationId.current = null;
				}
			} else if (locationId && map) {
				if (urlFilters.source === "uke") {
					pendingUkeLocationId.current = locationId;
					return;
				}

				pendingLocationId.current = locationId;
				try {
					const locationData = await fetchLocationWithStations(locationId, urlFilters);
					const location = toLocationInfo(locationData);

					map.flyTo({
						center: [location.longitude, location.latitude],
						zoom: 16,
						essential: true,
					});

					await new Promise<void>((resolve) => map.once("moveend", () => resolve()));
					showPopup([location.longitude, location.latitude], location, locationData.stations as StationWithoutCells[], null, urlFilters.source);
				} catch (error) {
					console.error("Failed to fetch shared location:", error);
					showApiError(error);
				} finally {
					pendingLocationId.current = null;
				}
			}
		},
		[map, showPopup],
	);

	useUrlSync({
		map,
		isLoaded,
		filters,
		zoom,
		onInitialize: handleUrlInitialize,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: This has to be "re-created" when filters change
	const prefetchCache = useMemo<PrefetchCache>(() => new Map(), [filters]);

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
		return filters.source === "uke"
			? ukeLocationsToGeoJSON(locations as unknown as UkeLocationWithPermits[], filters.source)
			: locationsToGeoJSON(locations, filters.source);
	}, [locations, filters.source]);

	useEffect(() => {
		const locationId = pendingUkeLocationId.current;
		if (!locationId || !map || filters.source !== "uke" || locations.length === 0) return;

		const ukeLocations = locations as unknown as UkeLocationWithPermits[];
		const ukeLocation = ukeLocations.find((loc) => loc.id === locationId);
		if (!ukeLocation) return;

		pendingUkeLocationId.current = null;

		const location: LocationInfo = {
			id: ukeLocation.id,
			city: ukeLocation.city ?? undefined,
			address: ukeLocation.address ?? undefined,
			latitude: ukeLocation.latitude,
			longitude: ukeLocation.longitude,
		};

		map.flyTo({
			center: [location.longitude, location.latitude],
			zoom: 16,
			essential: true,
		});

		const handleMoveEnd = () => {
			const ukeStations = groupPermitsByStation(ukeLocation.permits ?? [], ukeLocation);
			showPopup([location.longitude, location.latitude], location, null, ukeStations, filters.source);
		};

		map.once("moveend", handleMoveEnd);

		return () => {
			map.off("moveend", handleMoveEnd);
		};
	}, [map, locations, filters.source, showPopup]);

	const fetchAndUpdatePopup = useCallback(
		async (locationId: number, _location: LocationInfo, source: StationSource) => {
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
				const ukeLocation = (locations as unknown as UkeLocationWithPermits[]).find((loc) => loc.id === locationId);
				const ukeStations = groupPermitsByStation(ukeLocation?.permits ?? [], ukeLocation);
				showPopup(coordinates, { id: locationId, city, address, latitude: lat, longitude: lng }, null, ukeStations, source as StationSource);
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

			showPopup(coordinates, location, locationData?.stations ?? null, null, source as StationSource);
			await fetchAndUpdatePopup(locationId, location, source as StationSource);
		},
		[locations, showPopup, fetchAndUpdatePopup],
	);

	const handleFeatureContextMenu = useCallback(
		async (data: { coordinates: [number, number]; locationId: number; city?: string; address?: string; source: string }) => {
			const { coordinates } = data;
			const [lng, lat] = coordinates;
			setActiveMarker({ latitude: lat, longitude: lng });
		},
		[],
	);

	useMapLayer({
		map,
		isLoaded,
		geoJSON,
		onFeatureClick: handleFeatureClick,
		onFeatureContextMenu: handleFeatureContextMenu,
		onFeatureMouseDown: handleFeatureMouseDown,
	});

	useEffect(() => cleanupPopup, [cleanupPopup]);

	useEffect(() => {
		if (!map) return;

		const handleContextMenu = (e: maplibregl.MapMouseEvent) => {
			const features = map.queryRenderedFeatures(e.point, { layers: [POINT_LAYER_ID, `${POINT_LAYER_ID}-symbol`] });
			if (features.length === 0) setActiveMarker(null);
		};

		map.on("contextmenu", handleContextMenu);
		return () => {
			map.off("contextmenu", handleContextMenu);
		};
	}, [map]);

	const handleLocationSelect = useCallback(
		(lat: number, lng: number) => {
			map?.flyTo({ center: [lng, lat], zoom: 15, essential: true });
		},
		[map],
	);

	const handleStationSelect = useCallback(
		async (station: Station) => {
			if (!map) return;

			const lat = station.location?.latitude;
			const lng = station.location?.longitude;
			if (!lat || !lng) return;

			map.flyTo({ center: [lng, lat], zoom: 16, essential: true });

			await new Promise<void>((resolve) => map.once("moveend", () => resolve()));

			if (filters.source === "uke") {
				const ukeLocations = locations as unknown as UkeLocationWithPermits[];
				const ukeLocation = ukeLocations.find((loc) => loc.latitude.toFixed(6) === lat.toFixed(6) && loc.longitude.toFixed(6) === lng.toFixed(6));
				const ukeStations = groupPermitsByStation(ukeLocation?.permits ?? [], ukeLocation);

				const location: LocationInfo = {
					id: ukeLocation?.id ?? station.id,
					city: ukeLocation?.city ?? station.location?.city,
					address: ukeLocation?.address ?? station.location?.address,
					latitude: lat,
					longitude: lng,
				};
				showPopup([lng, lat], location, null, ukeStations, filters.source);
				return;
			}

			try {
				const data = await fetchLocationWithStations(station.location_id, filters);
				const location = toLocationInfo(data);
				showPopup([lng, lat], location, data.stations as StationWithoutCells[], null, filters.source);
			} catch (error) {
				console.error("Failed to fetch station data:", error);
				showApiError(error);
			}
		},
		[map, filters, locations, showPopup],
	);

	const handleCloseStationDetails = useCallback(() => setSelectedStation(null), []);
	const handleCloseUkeDetails = useCallback(() => setSelectedUkeStation(null), []);

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
				activeMarker={activeMarker}
				onFiltersChange={setFilters}
				onLocationSelect={handleLocationSelect}
				onStationSelect={handleStationSelect}
			/>
			<Suspense fallback={null}>
				{selectedStation && (
					<StationDetailsDialog
						key={selectedStation.id}
						stationId={selectedStation.id}
						source={selectedStation.source}
						onClose={handleCloseStationDetails}
					/>
				)}
				{selectedUkeStation && <UkePermitDetailsDialog station={selectedUkeStation} onClose={handleCloseUkeDetails} />}
			</Suspense>
		</>
	);
}
