import { useState, useCallback, useRef, useMemo, useEffect, useReducer } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon, Loading01Icon, Add01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import type MapLibreGL from "maplibre-gl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map as MapGL, useMap, MapMarker, MarkerContent, MapControls } from "@/components/ui/map";
import {
  POLAND_CENTER,
  PICKER_SOURCE_ID,
  PICKER_CIRCLE_LAYER_ID,
  PICKER_SYMBOL_LAYER_ID,
  PICKER_LAYER_IDS,
  PICKER_NEARBY_RADIUS_METERS,
  PICKER_UKE_SOURCE_ID,
  PICKER_UKE_CIRCLE_LAYER_ID,
  PICKER_UKE_SYMBOL_LAYER_ID,
  PICKER_UKE_LAYER_IDS,
} from "@/features/map/constants";
import { useMapBounds } from "@/features/map/hooks/useMapBounds";
import { syncPieImages } from "@/features/map/pieChart";
import { getOperatorData } from "@/features/map/geojson";
import { calculateDistance, groupPermitsByStation, getPermitBands } from "@/features/map/utils";
import { getOperatorColor } from "@/lib/operatorUtils";
import { reverseGeocode, fetchLocationsInViewport, fetchUkeLocationsInViewport, type NominatimResult } from "../api";
import { regionsQueryOptions } from "@/features/shared/queries";
import type { LocationWithStations, Region, UkeLocationWithPermits, UkeStation, Location } from "@/types/station";
import type { ProposedLocationForm } from "../types";
import { ChangeBadge } from "@/features/admin/submissions/components/common";
import type { LocationErrors } from "../utils/validation";

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
};

export function LocationPicker({
  location,
  errors,
  onLocationChange,
  onExistingLocationSelect: onExistingLocationSelectProp,
  onUkeStationSelect,
  locationDiffs,
  currentLocation,
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
          <HugeiconsIcon icon={Location01Icon} className="size-4 text-primary" />
          <span className="font-semibold text-sm">{t("locationPicker.title")}</span>
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
            {locationDiffs?.city && currentLocation && <ChangeBadge label={t("diff.current")} current={currentLocation.city || "—"} />}
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
            {locationDiffs?.address && currentLocation && <ChangeBadge label={t("diff.current")} current={currentLocation.address || "—"} />}
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

type NearbyPanel = {
  coords: { lat: number; lng: number };
  locations: (LocationWithStations & { distance: number })[];
};

type UkeStationPanel = {
  location: UkeLocationWithPermits;
  stations: UkeStation[];
};

type PanelState = { nearbyPanel: NearbyPanel | null; ukeStationPanel: UkeStationPanel | null };
type PanelAction =
  | { type: "select_location" }
  | { type: "select_uke"; location: UkeLocationWithPermits; stations: UkeStation[] }
  | { type: "nearby"; coords: { lat: number; lng: number }; locations: (LocationWithStations & { distance: number })[] }
  | { type: "clear_nearby" }
  | { type: "clear_uke" }
  | { type: "clear_both" };

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case "select_location":
      return { nearbyPanel: null, ukeStationPanel: null };
    case "select_uke":
      return { nearbyPanel: null, ukeStationPanel: { location: action.location, stations: action.stations } };
    case "nearby":
      return { nearbyPanel: { coords: action.coords, locations: action.locations }, ukeStationPanel: null };
    case "clear_nearby":
      return { ...state, nearbyPanel: null };
    case "clear_uke":
      return { ...state, ukeStationPanel: null };
    case "clear_both":
      return { nearbyPanel: null, ukeStationPanel: null };
    default:
      return state;
  }
}

type PickerMapInnerProps = {
  location: ProposedLocationForm;
  onCoordinatesSet: (lat: number, lon: number) => void;
  onExistingLocationSelect: (loc: LocationWithStations) => void;
  showUkeLocations: boolean;
  onUkeStationSelect?: (station: UkeStation) => void;
};

function NearbyLocationsPanel({
  nearbyPanel,
  onLocationSelect,
  onClose,
  onCreateNew,
}: {
  nearbyPanel: NearbyPanel;
  onLocationSelect: (loc: LocationWithStations) => void;
  onClose: () => void;
  onCreateNew: () => void;
}) {
  const { t } = useTranslation("submissions");

  return (
    <MapMarker longitude={nearbyPanel.coords.lng} latitude={nearbyPanel.coords.lat} anchor="bottom">
      <MarkerContent className="cursor-default">
        <div
          role="dialog"
          className="w-52 mb-2 bg-popover border rounded-lg shadow-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1.5 border-b bg-muted/50 flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">{t("locationPicker.nearbyLocations")}</span>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
              <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
            </button>
          </div>
          <div className="max-h-28 overflow-y-auto">
            {nearbyPanel.locations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => onLocationSelect(loc)}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-accent transition-colors text-left border-b last:border-b-0"
              >
                <HugeiconsIcon icon={Location01Icon} className="size-3 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{loc.address || loc.city || `#${loc.id}`}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">
                    {t("stations:stationsCount", { count: loc.stations?.length ?? 0 })} · {Math.round(loc.distance)} m
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onCreateNew}
            className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors border-t"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-3" />
            {t("locationPicker.createNewLocation")}
          </button>
        </div>
      </MarkerContent>
    </MapMarker>
  );
}

function UkeStationPanelOverlay({
  ukeStationPanel,
  onStationSelect,
}: {
  ukeStationPanel: UkeStationPanel;
  onStationSelect: (station: UkeStation) => void;
}) {
  const { t } = useTranslation("submissions");

  return (
    <MapMarker longitude={ukeStationPanel.location.longitude} latitude={ukeStationPanel.location.latitude} anchor="bottom">
      <MarkerContent className="cursor-default">
        <div
          role="dialog"
          className="w-72 mb-2 bg-popover border rounded-lg shadow-lg overflow-hidden text-sm"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-border/50">
            <h3 className="font-medium text-sm leading-tight pr-4">{ukeStationPanel.location.city}</h3>
            {ukeStationPanel.location.address && <p className="text-[11px] text-muted-foreground">{ukeStationPanel.location.address}</p>}
          </div>
          <div className="max-h-54 overflow-y-auto custom-scrollbar">
            {ukeStationPanel.stations.map((station) => {
              const mnc = station.operator?.mnc;
              const operatorName = station.operator?.name || "Unknown";
              const color = mnc ? getOperatorColor(mnc) : "#3b82f6";
              const bands = getPermitBands(station.permits);

              return (
                <button
                  key={station.station_id}
                  type="button"
                  onClick={() => onStationSelect(station)}
                  className="w-full text-left px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border/30 last:border-0"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-medium text-xs" style={{ color }}>
                      {operatorName}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">{station.station_id}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1 pl-3.5">
                    {bands.map((band) => (
                      <span
                        key={band}
                        className="px-1 py-px rounded-md bg-muted text-[8px] font-semibold uppercase tracking-wider text-muted-foreground border border-border/50"
                      >
                        {band}
                      </span>
                    ))}
                    <span className="px-1 py-px rounded-md bg-muted text-[8px] font-mono font-medium text-muted-foreground border border-border/50">
                      {station.permits.length} {station.permits.length === 1 ? "permit" : "permits"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="px-3 py-1 border-t border-border/50">
            <span className="text-[10px] text-muted-foreground">{t("locationPicker.selectStation")}</span>
          </div>
        </div>
      </MarkerContent>
    </MapMarker>
  );
}

function usePickerMapLayers({
  map,
  isLoaded,
  geoJSON,
  ukeGeoJSON,
  showUkeLocations,
}: {
  map: MapLibreGL.Map | null;
  isLoaded: boolean;
  geoJSON: GeoJSON.FeatureCollection;
  ukeGeoJSON: GeoJSON.FeatureCollection;
  showUkeLocations: boolean;
}) {
  const addedImagesRef = useRef(new Set<string>());
  const addedUkeImagesRef = useRef(new Set<string>());

  useEffect(() => {
    if (!map || !isLoaded) return;

    const ensureLayersExist = () => {
      if (!map.getSource(PICKER_SOURCE_ID)) {
        map.addSource(PICKER_SOURCE_ID, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        addedImagesRef.current.clear();
      }
      if (!map.getLayer(PICKER_CIRCLE_LAYER_ID)) {
        map.addLayer({
          id: PICKER_CIRCLE_LAYER_ID,
          type: "circle",
          source: PICKER_SOURCE_ID,
          filter: ["!", ["get", "isMultiOperator"]],
          paint: {
            "circle-color": ["get", "color"],
            "circle-radius": 6,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          },
        });
      }
      if (!map.getLayer(PICKER_SYMBOL_LAYER_ID)) {
        map.addLayer({
          id: PICKER_SYMBOL_LAYER_ID,
          type: "symbol",
          source: PICKER_SOURCE_ID,
          filter: ["get", "isMultiOperator"],
          layout: {
            "icon-image": ["get", "pieImageId"],
            "icon-size": 0.5,
            "icon-allow-overlap": true,
          },
        });
      }
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    ensureLayersExist();
    map.on("styledata", ensureLayersExist);

    for (const layerId of PICKER_LAYER_IDS) {
      map.on("mouseenter", layerId, handleMouseEnter);
      map.on("mouseleave", layerId, handleMouseLeave);
    }

    return () => {
      map.off("styledata", ensureLayersExist);

      for (const layerId of PICKER_LAYER_IDS) {
        map.off("mouseenter", layerId, handleMouseEnter);
        map.off("mouseleave", layerId, handleMouseLeave);
        try {
          map.removeLayer(layerId);
        } catch {
          // layer may already be removed
        }
      }
      try {
        map.removeSource(PICKER_SOURCE_ID);
      } catch {
        // source may already be removed
      }

      addedImagesRef.current.clear();
    };
  }, [map, isLoaded]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    const source = map.getSource(PICKER_SOURCE_ID) as MapLibreGL.GeoJSONSource | undefined;
    if (!source) return;

    syncPieImages(map, geoJSON.features, addedImagesRef.current);
    source.setData(geoJSON);
  }, [map, isLoaded, geoJSON]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const ensureUkeLayersExist = () => {
      if (!map.getSource(PICKER_UKE_SOURCE_ID)) {
        map.addSource(PICKER_UKE_SOURCE_ID, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        addedUkeImagesRef.current.clear();
      }
      if (!map.getLayer(PICKER_UKE_CIRCLE_LAYER_ID)) {
        map.addLayer({
          id: PICKER_UKE_CIRCLE_LAYER_ID,
          type: "circle",
          source: PICKER_UKE_SOURCE_ID,
          filter: ["!", ["get", "isMultiOperator"]],
          paint: {
            "circle-color": ["get", "color"],
            "circle-radius": 6,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          },
        });
      }
      if (!map.getLayer(PICKER_UKE_SYMBOL_LAYER_ID)) {
        map.addLayer({
          id: PICKER_UKE_SYMBOL_LAYER_ID,
          type: "symbol",
          source: PICKER_UKE_SOURCE_ID,
          filter: ["get", "isMultiOperator"],
          layout: {
            "icon-image": ["get", "pieImageId"],
            "icon-size": 0.5,
            "icon-allow-overlap": true,
          },
        });
      }
      if (map.getLayer(PICKER_CIRCLE_LAYER_ID)) map.moveLayer(PICKER_CIRCLE_LAYER_ID);
      if (map.getLayer(PICKER_SYMBOL_LAYER_ID)) map.moveLayer(PICKER_SYMBOL_LAYER_ID);
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    if (showUkeLocations) {
      ensureUkeLayersExist();
      map.on("styledata", ensureUkeLayersExist);

      for (const layerId of PICKER_UKE_LAYER_IDS) {
        map.on("mouseenter", layerId, handleMouseEnter);
        map.on("mouseleave", layerId, handleMouseLeave);
      }
    }

    return () => {
      map.off("styledata", ensureUkeLayersExist);

      for (const layerId of PICKER_UKE_LAYER_IDS) {
        map.off("mouseenter", layerId, handleMouseEnter);
        map.off("mouseleave", layerId, handleMouseLeave);
        try {
          map.removeLayer(layerId);
        } catch {
          // layer may already be removed
        }
      }
      try {
        map.removeSource(PICKER_UKE_SOURCE_ID);
      } catch {
        // source may already be removed
      }

      addedUkeImagesRef.current.clear();
    };
  }, [map, isLoaded, showUkeLocations]);

  useEffect(() => {
    if (!map || !isLoaded || !showUkeLocations) return;
    const source = map.getSource(PICKER_UKE_SOURCE_ID) as MapLibreGL.GeoJSONSource | undefined;
    if (!source) return;

    syncPieImages(map, ukeGeoJSON.features, addedUkeImagesRef.current);
    source.setData(ukeGeoJSON);
  }, [map, isLoaded, showUkeLocations, ukeGeoJSON]);
}

function PickerMapInner({ location, onCoordinatesSet, onExistingLocationSelect, showUkeLocations, onUkeStationSelect }: PickerMapInnerProps) {
  const { map, isLoaded } = useMap();
  const { bounds } = useMapBounds({ map, isLoaded, debounceMs: 500 });
  const [panelState, dispatchPanel] = useReducer(panelReducer, { nearbyPanel: null, ukeStationPanel: null });
  const { nearbyPanel, ukeStationPanel } = panelState;

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
          dispatchPanel({ type: "select_location" });
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
            dispatchPanel({ type: "select_uke", location: ukeLoc, stations });
          }
          return;
        }
      }

      const { lat, lng } = e.lngLat;
      const nearby = computeNearby({ lat, lng }, viewportLocationsRef.current);

      if (nearby.length > 0) {
        dispatchPanel({ type: "nearby", coords: { lat, lng }, locations: nearby });
      } else {
        lastInternalCoordsRef.current = { lat, lng };
        callbackRefs.current.onCoordinatesSet(lat, lng);
        dispatchPanel({ type: "clear_both" });
      }
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, isLoaded]);

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
      dispatchPanel({ type: "clear_nearby" });
    },
    [onExistingLocationSelect],
  );

  const handleCreateNewHere = useCallback(() => {
    if (!nearbyPanel) return;
    lastInternalCoordsRef.current = nearbyPanel.coords;
    onCoordinatesSet(nearbyPanel.coords.lat, nearbyPanel.coords.lng);
    dispatchPanel({ type: "clear_nearby" });
  }, [nearbyPanel, onCoordinatesSet]);

  const handleSelectUkeStation = useCallback(
    (station: UkeStation) => {
      onUkeStationSelect?.(station);
      dispatchPanel({ type: "clear_uke" });
    },
    [onUkeStationSelect],
  );

  return (
    <>
      {location.latitude !== null && location.longitude !== null && (
        <MapMarker longitude={location.longitude} latitude={location.latitude} draggable onDragEnd={handleDragEnd}>
          <MarkerContent>
            <SelectedLocationMarker />
          </MarkerContent>
        </MapMarker>
      )}

      {nearbyPanel && nearbyPanel.locations.length > 0 && (
        <NearbyLocationsPanel
          nearbyPanel={nearbyPanel}
          onLocationSelect={handleSelectNearby}
          onClose={() => dispatchPanel({ type: "clear_nearby" })}
          onCreateNew={handleCreateNewHere}
        />
      )}

      {ukeStationPanel && <UkeStationPanelOverlay ukeStationPanel={ukeStationPanel} onStationSelect={handleSelectUkeStation} />}
    </>
  );
}
