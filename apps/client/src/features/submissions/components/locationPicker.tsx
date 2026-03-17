import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon, Loading01Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map as MapGL, useMap, MapMarker, MarkerContent, MapControls } from "@/components/ui/map";
import { POLAND_CENTER, PICKER_LAYER_IDS, PICKER_NEARBY_RADIUS_METERS, PICKER_UKE_LAYER_IDS } from "@/features/map/constants";
import { useMapBounds } from "@/features/map/hooks/useMapBounds";
import { getOperatorData } from "@/features/map/geojson";
import { calculateDistance, groupPermitsByStation } from "@/features/map/utils";
import { reverseGeocode, fetchLocationsInViewport, fetchUkeLocationsInViewport, type NominatimResult } from "../api";
import { regionsQueryOptions } from "@/features/shared/queries";
import type { LocationWithStations, Region, UkeLocationWithPermits, UkeStation, Location } from "@/types/station";
import type { ProposedLocationForm } from "../types";
import { ChangeBadge } from "@/features/admin/submissions/components/common";
import type { LocationErrors } from "../utils/validation";
import { useLocationPickerState } from "./useLocationPickerState";
import { usePickerMapLayers } from "./usePickerMapLayers";
import { NearbyLocationsPanel } from "./NearbyLocationsPanel";
import { UkeStationPanelOverlay } from "./UkeStationPanelOverlay";

function roundCoord(value: number): number {
  return Math.round(value * 1000000) / 1000000;
}

function locationsToPickerGeoJSON(locations: LocationWithStations[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const loc of locations) {
    if (!loc.latitude || !loc.longitude) continue;

    const { operators, isMultiOperator, color } = getOperatorData((loc.stations ?? []).map((s) => s.operator?.mnc));
    const pieImageId = isMultiOperator ? `picker-pie-${operators.join("-")}` : undefined;

    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [loc.longitude, loc.latitude] },
      properties: {
        locationId: loc.id,
        city: loc.city ?? "",
        address: loc.address ?? "",
        stationCount: loc.stations?.length ?? 0,
        color,
        isMultiOperator,
        operators: JSON.stringify(operators),
        pieImageId,
      },
    });
  }

  return { type: "FeatureCollection", features };
}

function ukeLocationsToPickerGeoJSON(locations: UkeLocationWithPermits[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const loc of locations) {
    if (!loc.latitude || !loc.longitude || !loc.permits?.length) continue;

    const { operators, isMultiOperator, color } = getOperatorData(loc.permits.map((p) => p.operator?.mnc));
    const pieImageId = isMultiOperator ? `picker-uke-pie-${operators.join("-")}` : undefined;

    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [loc.longitude, loc.latitude] },
      properties: {
        locationId: loc.id,
        city: loc.city ?? "",
        address: loc.address ?? "",
        stationCount: loc.permits.length,
        color,
        isMultiOperator,
        operators: JSON.stringify(operators),
        pieImageId,
      },
    });
  }

  return { type: "FeatureCollection", features };
}

function applyGeocodeResult(result: NominatimResult, regions: Region[], onLocationChange: (patch: Partial<ProposedLocationForm>) => void) {
  const city = result.address.city || result.address.town || result.address.village || result.address.municipality;
  const addressParts = [result.address.road, result.address.house_number].filter(Boolean);
  const address = addressParts.join(" ") || result.display_name?.split(",")[0];
  const regionName = result.address.state?.replace(" Voivodeship", "").replace("województwo ", "");
  const matchedRegion = regions.find((r) => r.name.toLowerCase() === regionName?.toLowerCase());

  const patch: Partial<ProposedLocationForm> = {};
  if (city) patch.city = city;
  if (address) patch.address = address;
  if (matchedRegion) patch.region_id = matchedRegion.id;

  onLocationChange(patch);
}

function computeNearby(coords: { lat: number; lng: number }, locations: LocationWithStations[]): (LocationWithStations & { distance: number })[] {
  return locations
    .map((loc) => ({
      ...loc,
      distance: calculateDistance(coords.lat, coords.lng, loc.latitude, loc.longitude),
    }))
    .filter((loc) => loc.distance <= PICKER_NEARBY_RADIUS_METERS)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);
}

type LocationPickerProps = {
  location: ProposedLocationForm;
  errors?: LocationErrors;
  onLocationChange: (patch: Partial<ProposedLocationForm>) => void;
  onExistingLocationSelect?: (location: LocationWithStations) => void;
  onUkeStationSelect?: (station: UkeStation) => void;
  locationDiffs?: { coords: boolean; city: boolean; address: boolean } | null;
  currentLocation?: Location | null;
  showEditLocationLink?: boolean;
};

export function LocationPicker({
  location,
  errors,
  onLocationChange,
  onExistingLocationSelect: onExistingLocationSelectProp,
  onUkeStationSelect,
  locationDiffs,
  currentLocation,
  showEditLocationLink,
}: LocationPickerProps) {
  const { t } = useTranslation(["submissions", "common"]);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [showUkeLocations, setShowUkeLocations] = useState(false);

  const { data: regions = [] } = useQuery(regionsQueryOptions());

  const handleFetchAddress = async () => {
    if (location.latitude === null || location.longitude === null) return;
    setIsFetchingAddress(true);
    const result = await reverseGeocode(location.latitude, location.longitude).catch(() => null);
    if (result) applyGeocodeResult(result, regions, onLocationChange);
    setIsFetchingAddress(false);
  };

  const handleMapCoordinatesSet = useCallback(
    (lat: number, lon: number) => {
      onLocationChange({ latitude: roundCoord(lat), longitude: roundCoord(lon) });
    },
    [onLocationChange],
  );

  const handleExistingLocationSelect = useCallback(
    (loc: LocationWithStations) => {
      if (onExistingLocationSelectProp) {
        onExistingLocationSelectProp(loc);
      } else {
        onLocationChange({
          latitude: loc.latitude,
          longitude: loc.longitude,
          city: loc.city ?? undefined,
          address: loc.address ?? undefined,
          region_id: loc.region?.id ?? null,
        });
      }
    },
    [onLocationChange, onExistingLocationSelectProp],
  );

  const hasCoordinates = location.latitude !== null && location.longitude !== null;

  const [initialView] = useState(() => {
    const has = location.longitude !== null && location.longitude !== undefined && location.latitude !== null && location.latitude !== undefined;
    return {
      center: (has ? [location.longitude, location.latitude] : POLAND_CENTER) as [number, number],
      zoom: has ? 15 : 6,
    };
  });

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/50 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Location01Icon} className="size-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{t("locationPicker.title")}</span>
          {showEditLocationLink && currentLocation?.id && (
            <Link
              to={`/admin/locations/${currentLocation.id}` as "/"}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={PencilEdit01Icon} className="size-3" />
              {t("locationPicker.editLocation")}
            </Link>
          )}
        </div>
        {onUkeStationSelect && (
          <label htmlFor="enable-uke-locations" className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox id="enable-uke-locations" checked={showUkeLocations} onCheckedChange={(checked) => setShowUkeLocations(!!checked)} />
            <span className="text-xs text-muted-foreground select-none">{t("locationPicker.showUkeLocations")}</span>
          </label>
        )}
      </div>

      <div className="h-75 lg:h-87.5 relative">
        <MapGL center={initialView.center} zoom={initialView.zoom}>
          <PickerMapInner
            location={location}
            onCoordinatesSet={handleMapCoordinatesSet}
            onExistingLocationSelect={handleExistingLocationSelect}
            showUkeLocations={showUkeLocations}
            onUkeStationSelect={onUkeStationSelect}
          />
          <MapControls showZoom showLocate position="bottom-right" />
        </MapGL>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFetchAddress}
            disabled={!hasCoordinates || isFetchingAddress}
            className="h-8 text-xs"
          >
            {isFetchingAddress ? (
              <HugeiconsIcon icon={Loading01Icon} className="size-3.5 animate-spin" />
            ) : (
              <HugeiconsIcon icon={Location01Icon} className="size-3.5" />
            )}
            {t("locationPicker.fetchAddress")}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="latitude" className="text-xs">
              {t("common:labels.latitude")}
            </Label>
            <Input
              id="latitude"
              type="number"
              step="0.001"
              placeholder="52.2297"
              value={location.latitude ?? ""}
              onChange={(e) => onLocationChange({ latitude: e.target.value ? Number.parseFloat(e.target.value) : null })}
              className={`h-8 font-mono text-sm ${errors?.latitude ? "border-destructive" : ""}`}
            />
            {errors?.latitude && <p className="text-xs text-destructive">{t(errors.latitude)}</p>}
            {locationDiffs?.coords && currentLocation && <ChangeBadge label={t("diff.current")} current={currentLocation.latitude.toFixed(6)} />}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="longitude" className="text-xs">
              {t("common:labels.longitude")}
            </Label>
            <Input
              id="longitude"
              type="number"
              step="0.001"
              placeholder="21.0122"
              value={location.longitude ?? ""}
              onChange={(e) => onLocationChange({ longitude: e.target.value ? Number.parseFloat(e.target.value) : null })}
              className={`h-8 font-mono text-sm ${errors?.longitude ? "border-destructive" : ""}`}
            />
            {errors?.longitude && <p className="text-xs text-destructive">{t(errors.longitude)}</p>}
            {locationDiffs?.coords && currentLocation && <ChangeBadge label={t("diff.current")} current={currentLocation.longitude.toFixed(6)} />}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="region" className="text-xs">
            {t("common:labels.region")}
          </Label>
          <Select
            value={location.region_id?.toString() ?? ""}
            onValueChange={(value) => onLocationChange({ region_id: value ? Number.parseInt(value, 10) : null })}
          >
            <SelectTrigger className={`h-8 text-sm ${errors?.region_id ? "border-destructive" : ""}`}>
              <SelectValue>
                {location.region_id ? regions.find((r) => r.id === location.region_id)?.name : t("locationPicker.regionPlaceholder")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id.toString()}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.region_id && <p className="text-xs text-destructive">{t(errors.region_id)}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-xs">
              {t("common:labels.city")}
            </Label>
            <Input
              id="city"
              placeholder={t("locationPicker.cityPlaceholder")}
              value={location.city ?? ""}
              onChange={(e) => onLocationChange({ city: e.target.value })}
              className="h-8 text-sm"
            />
            {locationDiffs?.city && currentLocation && <ChangeBadge label={t("diff.current")} current={currentLocation.city || "-"} />}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs">
              {t("common:labels.address")}
            </Label>
            <Input
              id="address"
              placeholder={t("locationPicker.addressPlaceholder")}
              value={location.address ?? ""}
              onChange={(e) => onLocationChange({ address: e.target.value })}
              className="h-8 text-sm"
            />
            {locationDiffs?.address && currentLocation && <ChangeBadge label={t("diff.current")} current={currentLocation.address || "-"} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectedLocationMarker() {
  return (
    <div className="relative flex items-center justify-center">
      <span className="absolute h-7 w-7 rounded-full bg-foreground/20 animate-ping" />
      <span className="absolute h-5 w-5 rounded-full bg-foreground/10" />
      <div className="relative h-4 w-4 rounded-full border-[3px] border-foreground bg-background shadow-lg" />
    </div>
  );
}

type PickerMapInnerProps = {
  location: ProposedLocationForm;
  onCoordinatesSet: (lat: number, lon: number) => void;
  onExistingLocationSelect: (loc: LocationWithStations) => void;
  showUkeLocations: boolean;
  onUkeStationSelect?: (station: UkeStation) => void;
};

function PickerMapInner({ location, onCoordinatesSet, onExistingLocationSelect, showUkeLocations, onUkeStationSelect }: PickerMapInnerProps) {
  const { map, isLoaded } = useMap();
  const { bounds } = useMapBounds({ map, isLoaded, debounceMs: 500 });
  const { nearbyPanel, ukeStationPanel, dispatchPanel } = useLocationPickerState();

  const lastInternalCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const { data: viewportLocations = [] } = useQuery({
    queryKey: ["picker-locations", bounds],
    queryFn: () => fetchLocationsInViewport(bounds, { orphaned: true }),
    enabled: !!bounds,
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  });

  const { data: viewportUkeLocations = [] } = useQuery({
    queryKey: ["picker-uke-locations", bounds],
    queryFn: () => fetchUkeLocationsInViewport(bounds),
    enabled: !!bounds && showUkeLocations,
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  });

  const geoJSON = useMemo(() => locationsToPickerGeoJSON(viewportLocations), [viewportLocations]);
  const ukeGeoJSON = useMemo(() => ukeLocationsToPickerGeoJSON(viewportUkeLocations), [viewportUkeLocations]);

  usePickerMapLayers({ map, isLoaded, geoJSON, ukeGeoJSON, showUkeLocations });

  const viewportLocationsRef = useRef(viewportLocations);
  const viewportUkeLocationsRef = useRef(viewportUkeLocations);
  const showUkeLocationsRef = useRef(showUkeLocations);
  const callbackRefs = useRef({ onCoordinatesSet, onExistingLocationSelect });

  useEffect(() => {
    viewportLocationsRef.current = viewportLocations;
    viewportUkeLocationsRef.current = viewportUkeLocations;
    showUkeLocationsRef.current = showUkeLocations;
    callbackRefs.current = { onCoordinatesSet, onExistingLocationSelect };
  }, [viewportLocations, viewportUkeLocations, showUkeLocations, onCoordinatesSet, onExistingLocationSelect]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [...PICKER_LAYER_IDS] });

      if (features.length > 0) {
        const locationId = features[0].properties?.locationId;
        const loc = viewportLocationsRef.current.find((l) => l.id === locationId);
        if (loc) {
          lastInternalCoordsRef.current = { lat: loc.latitude, lng: loc.longitude };
          callbackRefs.current.onExistingLocationSelect(loc);
          dispatchPanel({ type: "SELECT_LOCATION" });
        }
        return;
      }

      if (showUkeLocationsRef.current) {
        const ukeFeatures = map.queryRenderedFeatures(e.point, { layers: [...PICKER_UKE_LAYER_IDS] });
        if (ukeFeatures.length > 0) {
          const locationId = ukeFeatures[0].properties?.locationId;
          const ukeLoc = viewportUkeLocationsRef.current.find((l) => l.id === locationId);
          if (ukeLoc) {
            const stations = groupPermitsByStation(ukeLoc.permits ?? [], ukeLoc);
            dispatchPanel({ type: "SELECT_UKE", location: ukeLoc, stations });
          }
          return;
        }
      }

      const { lat, lng } = e.lngLat;
      const nearby = computeNearby({ lat, lng }, viewportLocationsRef.current);

      if (nearby.length > 0) {
        dispatchPanel({ type: "NEARBY", coords: { lat, lng }, locations: nearby });
      } else {
        lastInternalCoordsRef.current = { lat, lng };
        callbackRefs.current.onCoordinatesSet(lat, lng);
        dispatchPanel({ type: "CLEAR_BOTH" });
      }
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, isLoaded, dispatchPanel]);

  useEffect(() => {
    if (!map || location.latitude === null || location.longitude === null) return;

    const last = lastInternalCoordsRef.current;
    if (last && roundCoord(last.lat) === roundCoord(location.latitude) && roundCoord(last.lng) === roundCoord(location.longitude)) {
      lastInternalCoordsRef.current = null;
      return;
    }
    lastInternalCoordsRef.current = null;

    map.flyTo({
      center: [location.longitude, location.latitude],
      zoom: Math.max(map.getZoom(), 15),
      duration: 1000,
      speed: 1.5,
    });
  }, [map, location.latitude, location.longitude]);

  const handleDragEnd = useCallback(
    (lngLat: { lng: number; lat: number }) => {
      lastInternalCoordsRef.current = { lat: lngLat.lat, lng: lngLat.lng };
      onCoordinatesSet(lngLat.lat, lngLat.lng);
    },
    [onCoordinatesSet],
  );

  const handleSelectNearby = useCallback(
    (loc: LocationWithStations) => {
      lastInternalCoordsRef.current = { lat: loc.latitude, lng: loc.longitude };
      onExistingLocationSelect(loc);
      dispatchPanel({ type: "CLEAR_NEARBY" });
    },
    [onExistingLocationSelect, dispatchPanel],
  );

  const handleCreateNewHere = useCallback(() => {
    if (!nearbyPanel) return;
    lastInternalCoordsRef.current = nearbyPanel.coords;
    onCoordinatesSet(nearbyPanel.coords.lat, nearbyPanel.coords.lng);
    dispatchPanel({ type: "CLEAR_NEARBY" });
  }, [nearbyPanel, onCoordinatesSet, dispatchPanel]);

  const handleSelectUkeStation = useCallback(
    (station: UkeStation) => {
      onUkeStationSelect?.(station);
      dispatchPanel({ type: "CLEAR_UKE" });
    },
    [onUkeStationSelect, dispatchPanel],
  );

  return (
    <>
      {location.latitude !== null && location.longitude !== null ? (
        <MapMarker longitude={location.longitude} latitude={location.latitude} draggable onDragEnd={handleDragEnd}>
          <MarkerContent>
            <SelectedLocationMarker />
          </MarkerContent>
        </MapMarker>
      ) : null}

      {nearbyPanel && nearbyPanel.locations.length > 0 ? (
        <NearbyLocationsPanel
          nearbyPanel={nearbyPanel}
          onLocationSelect={handleSelectNearby}
          onClose={() => dispatchPanel({ type: "CLEAR_NEARBY" })}
          onCreateNew={handleCreateNewHere}
        />
      ) : null}

      {ukeStationPanel ? <UkeStationPanelOverlay ukeStationPanel={ukeStationPanel} onStationSelect={handleSelectUkeStation} /> : null}
    </>
  );
}
