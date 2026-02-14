import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Map as LibreMap, MapControls, useMap } from "@/components/ui/map";
import { POLAND_CENTER } from "../constants";
import { StationsLayer, DEFAULT_FILTERS, loadMapFilters, saveMapFilters } from "./stationsLayer";
import type { StationFilters, StationSource, Station, LocationInfo, StationWithoutCells, UkeStation, UkeLocationWithPermits } from "@/types/station";
import { MapSearchOverlay } from "./search-overlay";
import { useMapBounds } from "../hooks/useMapBounds";
import { fetchLocations, fetchLocationWithStations, fetchRadioLines } from "../api";
import { useMapPopup } from "../hooks/useMapPopup";
import { groupPermitsByStation } from "../utils";
import { showApiError } from "@/lib/api";
import { usePreferences } from "@/hooks/usePreferences";

const RadioLinesLayer = lazy(() => import("./radioLinesLayer"));

const StationDetailsDialog = lazy(() =>
	import("@/features/station-details/components/stationsDetailsDialog").then((m) => ({ default: m.StationDetailsDialog })),
);
const UkePermitDetailsDialog = lazy(() =>
	import("@/features/station-details/components/ukePermitDetailsDialog").then((m) => ({ default: m.UkePermitDetailsDialog })),
);

const POLAND_BOUNDS: [[number, number], [number, number]] = [
	[14.0, 48.9],
	[24.2, 55.0],
];

function toLocationInfo(loc: { id: number; city?: string; address?: string; latitude: number; longitude: number }): LocationInfo {
	return { id: loc.id, city: loc.city, address: loc.address, latitude: loc.latitude, longitude: loc.longitude };
}

function MapViewInner() {
	const { map, isLoaded } = useMap();
	const { bounds, zoom, isMoving } = useMapBounds({ map, isLoaded });
	const { preferences } = usePreferences();
	const [filters, setFilters] = useState<StationFilters>(() => loadMapFilters() ?? DEFAULT_FILTERS);
	const [activeMarker, setActiveMarker] = useState<{ latitude: number; longitude: number } | null>(null);

	useEffect(() => {
		saveMapFilters(filters);
	}, [filters]);

	const [selectedStation, setSelectedStation] = useState<{ id: number; source: StationSource } | null>(null);
	const [selectedUkeStation, setSelectedUkeStation] = useState<UkeStation | null>(null);

	const {
		showPopup,
		updatePopupStations,
		cleanup: cleanupPopup,
	} = useMapPopup({
		map,
		onOpenStationDetails: useCallback((id: number, source: StationSource) => setSelectedStation({ id, source }), []),
		onOpenUkeStationDetails: useCallback((station: UkeStation) => setSelectedUkeStation(station), []),
	});

	const {
		data: locationsResponse,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: ["locations", bounds, filters],
		queryFn: () => fetchLocations(bounds, filters),
		enabled: isLoaded && !!bounds && !isMoving,
		staleTime: 1000 * 60 * 2,
		placeholderData: (prev) => prev,
	});

	const locations = locationsResponse?.data ?? [];
	const locationCount = locations.length;
	const totalCount = locationsResponse?.totalCount ?? 0;

	const { data: radioLinesResponse, isFetching: isRadioLinesFetching } = useQuery({
		queryKey: ["radiolines", bounds],
		queryFn: ({ signal }) => fetchRadioLines(bounds, { signal }),
		enabled: filters.showRadiolines && !!bounds && !isMoving && zoom >= preferences.radiolinesMinZoom,
		staleTime: 1000 * 60 * 5,
		placeholderData: (prev) => prev,
	});

	const radioLines = radioLinesResponse?.data ?? [];
	const radioLineCount = radioLines.length;
	const radioLineTotalCount = radioLinesResponse?.totalCount ?? 0;

	const handleLocationSelect = useCallback(
		(lat: number, lng: number) => {
			map?.flyTo({ center: [lng, lat], zoom: 15, essential: true, speed: 1.5 });
		},
		[map],
	);

	const handleStationSelect = useCallback(
		async (station: Station) => {
			if (!map) return;

			const lat = station.location?.latitude;
			const lng = station.location?.longitude;
			if (!lat || !lng) return;

			map.flyTo({ center: [lng, lat], zoom: 16, essential: true, speed: 1.5 });

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

	const handleOpenStationDetails = useCallback((id: number, source: StationSource) => setSelectedStation({ id, source }), []);
	const handleCloseStationDetails = useCallback(() => setSelectedStation(null), []);
	const handleOpenUkeStationDetails = useCallback((station: UkeStation) => setSelectedUkeStation(station), []);
	const handleCloseUkeDetails = useCallback(() => setSelectedUkeStation(null), []);

	return (
		<>
			<MapSearchOverlay
				locationCount={locationCount}
				totalCount={totalCount}
				radioLineCount={filters.showRadiolines ? radioLineCount : 0}
				radioLineTotalCount={filters.showRadiolines ? radioLineTotalCount : 0}
				isRadioLinesFetching={filters.showRadiolines && isRadioLinesFetching}
				isLoading={isLoading}
				isFetching={isFetching}
				filters={filters}
				zoom={zoom}
				activeMarker={activeMarker}
				onFiltersChange={setFilters}
				onLocationSelect={handleLocationSelect}
				onStationSelect={handleStationSelect}
			/>
			<StationsLayer
				filters={filters}
				onFiltersChange={setFilters}
				locationsResponse={locationsResponse}
				zoom={zoom}
				onActiveMarkerChange={setActiveMarker}
				onOpenStationDetails={handleOpenStationDetails}
				onOpenUkeStationDetails={handleOpenUkeStationDetails}
				showPopup={showPopup}
				updatePopupStations={updatePopupStations}
				cleanupPopup={cleanupPopup}
			/>
			{filters.showRadiolines && (
				<Suspense fallback={null}>
					<RadioLinesLayer radioLines={radioLines} />
				</Suspense>
			)}
			<MapControls showLocate showCompass showScale />
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

export default function MapView() {
	return (
		<LibreMap center={POLAND_CENTER} zoom={7} maxBounds={POLAND_BOUNDS} minZoom={5}>
			<MapViewInner />
		</LibreMap>
	);
}
