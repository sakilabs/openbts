import { lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useState, type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import MapLibreGL from "maplibre-gl";

import { Map as LibreMap, MapControls, useMap } from "@/components/ui/map";
import { StationsLayer, DEFAULT_FILTERS, locationQueryKey, loadMapFilters, saveMapFilters } from "@/features/map/components/stationsLayer";
import { MapSearchOverlay } from "@/features/map/components/search-overlay";
import { useMapPopup } from "@/features/map/hooks/useMapPopup";
import { useMapBounds } from "@/features/map/hooks/useMapBounds";
import { fetchLocationWithStations } from "@/features/map/api";
import { toLocationInfo } from "@/features/map/utils";
import { useListDetail } from "@/features/lists/hooks/useListDetail";
import { useSettings } from "@/hooks/useSettings";
import { authClient } from "@/lib/authClient";
import type { LocationsResponse } from "@/features/map/api";
import type { LocationWithStations, StationSource, StationFilters, StationWithoutCells, UkeStation, RadioLine, Station } from "@/types/station";
import { POLAND_CENTER, POLAND_BOUNDS } from "@/features/map/constants";

const RadioLinesLayer = lazy(() => import("@/features/map/components/radioLinesLayer"));
const StationDetailsDialog = lazy(() =>
  import("@/features/station-details/components/stationsDetailsDialog").then((m) => ({ default: m.StationDetailsDialog })),
);
const UkePermitDetailsDialog = lazy(() =>
  import("@/features/station-details/components/ukePermitDetailsDialog").then((m) => ({ default: m.UkePermitDetailsDialog })),
);

type ListInfoBannerProps = { name: string; description?: string };

function ListInfoBanner({ name, description }: ListInfoBannerProps): JSX.Element {
  return (
    <div className="hidden md:flex absolute top-4 left-1/2 -translate-x-1/2 z-10 items-stretch shadow-xl rounded-lg overflow-hidden border bg-background/95 backdrop-blur-md pointer-events-none">
      <div className="px-3 py-1.5 flex items-center gap-2">
        <div className="size-1.5 rounded-full shrink-0 bg-primary/70" />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold leading-none tracking-tight truncate max-w-56">{name}</span>
          {description && <span className="text-[10px] text-muted-foreground leading-none mt-0.5 truncate max-w-56">{description}</span>}
        </div>
      </div>
    </div>
  );
}

type DetailState = {
  selectedStation: { id: number; source: StationSource } | null;
};

type DetailAction = { type: "OPEN"; id: number; source: StationSource } | { type: "CLOSE" };

function detailReducer(_state: DetailState, action: DetailAction): DetailState {
  if (action.type === "OPEN") return { selectedStation: { id: action.id, source: action.source } };
  return { selectedStation: null };
}

function ListMapInner({ uuid }: { uuid: string }): JSX.Element {
  const { map, isLoaded } = useMap();
  const { zoom } = useMapBounds({ map, isLoaded });
  const { data: listData, isLoading, isError } = useListDetail(uuid);
  const { data: runtimeSettings } = useSettings();
  const { data: session } = authClient.useSession();
  const showAddToList = !!session?.user && !!runtimeSettings?.enableUserLists;

  const [filters, setFiltersState] = useState<StationFilters>(() => {
    const saved = loadMapFilters() ?? DEFAULT_FILTERS;
    return { ...saved, showStations: true };
  });
  const setFilters = useCallback((update: StationFilters | ((prev: StationFilters) => StationFilters)) => {
    setFiltersState((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      saveMapFilters(next);
      return next;
    });
  }, []);

  const [detailState, dispatchDetail] = useReducer(detailReducer, { selectedStation: null });
  const [selectedUkeStation, setSelectedUkeStation] = useState<UkeStation | null>(null);
  const [activeMarker, setActiveMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [popupLocationState, setPopupLocationState] = useState<{
    location: { locationId: number; source: StationSource } | null;
    tempLocations: LocationWithStations[];
  }>({ location: null, tempLocations: [] });
  const activePopupLocation = popupLocationState.location;
  const setPopupLocation = useCallback(
    (location: { locationId: number; source: StationSource } | null) => setPopupLocationState((prev) => ({ ...prev, location })),
    [],
  );

  const locationsResponse = useMemo<LocationsResponse | undefined>(() => {
    if (!listData) return undefined;
    const locationMap = new Map<number, LocationWithStations>();
    for (const station of listData.stations) {
      if (!station.location) continue;
      const locId = station.location.id;
      if (!locationMap.has(locId)) {
        locationMap.set(locId, {
          id: locId,
          latitude: station.location.latitude,
          longitude: station.location.longitude,
          city: station.location.city ?? undefined,
          address: station.location.address ?? undefined,
          region: station.location.region,
          updatedAt: station.location.updatedAt,
          createdAt: station.location.createdAt,
          stations: [],
        });
      }
      locationMap.get(locId)!.stations.push(station as unknown as StationWithoutCells);
    }
    for (const tempLoc of popupLocationState.tempLocations) {
      if (!locationMap.has(tempLoc.id)) {
        locationMap.set(tempLoc.id, tempLoc);
      }
    }
    return { data: Array.from(locationMap.values()), totalCount: listData.stations.length };
  }, [listData, popupLocationState.tempLocations]);

  const ukeLocations = listData?.ukeLocations;
  const ukeLocationsResponse = useMemo<LocationsResponse | undefined>(() => {
    if (!ukeLocations?.length) return undefined;
    return { data: ukeLocations as unknown as LocationsResponse["data"], totalCount: ukeLocations.length };
  }, [ukeLocations]);

  const listStations = listData?.stations;
  const listRadiolines = listData?.radiolines;
  useEffect(() => {
    if (!map || !isLoaded || !listStations) return;
    const bounds = new MapLibreGL.LngLatBounds();
    for (const station of listStations) {
      if (station.location) bounds.extend([station.location.longitude, station.location.latitude]);
    }
    for (const rl of listRadiolines ?? []) {
      bounds.extend([rl.tx.longitude, rl.tx.latitude]);
      bounds.extend([rl.rx.longitude, rl.rx.latitude]);
    }
    for (const loc of ukeLocations ?? []) {
      bounds.extend([loc.longitude, loc.latitude]);
    }
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 80, maxZoom: 14 });
  }, [map, isLoaded, listStations, listRadiolines, ukeLocations]);

  const handleOpenStationDetails = useCallback((id: number, source: StationSource) => dispatchDetail({ type: "OPEN", id, source }), []);
  const handleOpenUkeStationDetails = useCallback((station: UkeStation) => setSelectedUkeStation(station), []);
  const handlePopupClose = useCallback(() => {
    setPopupLocationState({ location: null, tempLocations: [] });
  }, []);

  const {
    showPopup,
    updatePopupStations,
    cleanup: cleanupPopup,
  } = useMapPopup({
    map,
    showAddToList,
    onOpenStationDetails: handleOpenStationDetails,
    onOpenUkeStationDetails: handleOpenUkeStationDetails,
    onClose: handlePopupClose,
  });

  const handleActiveMarkerClear = useCallback(() => setActiveMarker(null), []);

  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      map?.flyTo({ center: [lng, lat], zoom: 15, essential: true, speed: 1.5 });
    },
    [map],
  );

  const handleStationSelect = useCallback(
    (station: Station) => {
      const lat = station.location?.latitude;
      const lng = station.location?.longitude;
      if (!lat || !lng || !map) return;

      const locationId = station.location_id;
      const alreadyInList = listData?.stations.some((s) => s.location?.id === locationId);
      if (!alreadyInList) {
        const tempLoc: LocationWithStations = {
          id: locationId,
          latitude: lat,
          longitude: lng,
          city: station.location?.city ?? undefined,
          address: station.location?.address ?? undefined,
          region: station.location?.region ?? { id: 0, name: "", code: "" },
          updatedAt: station.location?.updatedAt ?? new Date().toISOString(),
          createdAt: station.location?.createdAt ?? new Date().toISOString(),
          stations: [station as unknown as StationWithoutCells],
        };
        setPopupLocationState((prev) => ({ ...prev, tempLocations: [...prev.tempLocations.filter((l) => l.id !== locationId), tempLoc] }));
      }

      const locationInfo = {
        id: locationId,
        city: station.location?.city ?? undefined,
        address: station.location?.address ?? undefined,
        region: station.location?.region?.name,
        latitude: lat,
        longitude: lng,
      };

      map.flyTo({ center: [lng, lat], zoom: 16, essential: true, speed: 1.5 });
      void map.once("moveend", () => {
        showPopup([lng, lat], locationInfo, [station as unknown as StationWithoutCells], null, "internal");
        setPopupLocation({ locationId, source: "internal" });
      });
    },
    [map, listData, showPopup, setPopupLocation],
  );

  const { data: popupLocationData } = useQuery({
    queryKey: locationQueryKey(activePopupLocation?.locationId ?? 0, DEFAULT_FILTERS),
    queryFn: () => fetchLocationWithStations(activePopupLocation?.locationId ?? 0, DEFAULT_FILTERS),
    enabled: !!activePopupLocation && activePopupLocation.source === "internal",
    staleTime: 1000 * 60 * 2,
  });

  useEffect(() => {
    if (!popupLocationData || !activePopupLocation) return;
    if (popupLocationData.id !== activePopupLocation.locationId) return;
    const listStationIds = new Set(listData?.stations.map((s) => s.id) ?? []);
    const filteredStations = (popupLocationData.stations as StationWithoutCells[]).filter((s) => listStationIds.has(s.id));
    updatePopupStations(toLocationInfo(popupLocationData), filteredStations, activePopupLocation.source);
  }, [popupLocationData, activePopupLocation, updatePopupStations, listData]);

  const popupActions = useMemo(
    () => ({
      show: showPopup,
      updateStations: updatePopupStations,
      cleanup: cleanupPopup,
      setLocation: setPopupLocation,
    }),
    [showPopup, updatePopupStations, cleanupPopup, setPopupLocation],
  );

  const stationActions = useMemo(
    () => ({
      openDetails: handleOpenStationDetails,
      openUkeDetails: handleOpenUkeStationDetails,
    }),
    [handleOpenStationDetails, handleOpenUkeStationDetails],
  );

  const stationCount = (listData?.stations.length ?? 0) + (listData?.ukeLocations?.length ?? 0);
  const radiolineCount = listData?.radiolines.length ?? 0;

  return (
    <>
      <MapSearchOverlay
        locationCount={stationCount}
        totalCount={stationCount}
        radioLineCount={radiolineCount}
        radioLineTotalCount={radiolineCount}
        isLoading={isLoading}
        filters={filters}
        zoom={zoom}
        activeMarker={activeMarker}
        onActiveMarkerClear={handleActiveMarkerClear}
        onFiltersChange={setFilters}
        onLocationSelect={handleLocationSelect}
        onStationSelect={handleStationSelect}
        hideAPIFilters
      />

      {listData ? <ListInfoBanner name={listData.name} description={listData.description ?? undefined} /> : null}

      {(isError || (!isLoading && !listData)) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">This list was not found or is private.</p>
        </div>
      )}

      <StationsLayer
        filters={filters}
        onFiltersChange={setFilters}
        locationsResponse={filters.source === "uke" ? ukeLocationsResponse : locationsResponse}
        zoom={zoom}
        onActiveMarkerChange={setActiveMarker}
        stationActions={stationActions}
        popupActions={popupActions}
      />

      {filters.showRadiolines && (listData?.radiolines.length ?? 0) > 0 ? (
        <Suspense fallback={null}>
          <RadioLinesLayer radioLines={listData!.radiolines as RadioLine[]} showAddToList={showAddToList} />
        </Suspense>
      ) : null}

      <MapControls showLocate showCompass showScale showFullscreen />

      <Suspense fallback={null}>
        {detailState.selectedStation ? (
          <StationDetailsDialog
            key={detailState.selectedStation.id}
            stationId={detailState.selectedStation.id}
            source={detailState.selectedStation.source}
            onClose={() => dispatchDetail({ type: "CLOSE" })}
          />
        ) : null}
      </Suspense>

      <Suspense fallback={null}>
        {selectedUkeStation ? <UkePermitDetailsDialog station={selectedUkeStation} onClose={() => setSelectedUkeStation(null)} /> : null}
      </Suspense>
    </>
  );
}

export function ListMapView({ uuid }: { uuid: string }): JSX.Element {
  return (
    <LibreMap center={POLAND_CENTER} zoom={6} maxBounds={POLAND_BOUNDS} minZoom={5}>
      <ListMapInner uuid={uuid} />
    </LibreMap>
  );
}
