import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon, Loading01Icon, Add01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import type MapLibreGL from "maplibre-gl";

import { Button } from "@/components/ui/button";
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
} from "@/features/map/constants";
import { useMapBounds } from "@/features/map/hooks/useMapBounds";
import { syncPieImages } from "@/features/map/pieChart";
import { getOperatorData } from "@/features/map/geojson";
import { calculateDistance } from "@/features/map/utils";
import { reverseGeocode, fetchLocationsInViewport, type NominatimResult } from "../api";
import { regionsQueryOptions } from "@/features/shared/queries";
import type { LocationWithStations, Region } from "@/types/station";
import type { ProposedLocationForm } from "../types";
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
};

export function LocationPicker({ location, errors, onLocationChange }: LocationPickerProps) {
	const { t } = useTranslation("submissions");
	const [isFetchingAddress, setIsFetchingAddress] = useState(false);

	const { data: regions = [] } = useQuery(regionsQueryOptions());

	const handleFetchAddress = async () => {
		if (location.latitude === null || location.longitude === null) return;
		setIsFetchingAddress(true);
		try {
			const result = await reverseGeocode(location.latitude, location.longitude);
			if (result) applyGeocodeResult(result, regions, onLocationChange);
		} finally {
			setIsFetchingAddress(false);
		}
	};

	const handleMapCoordinatesSet = useCallback(
		async (lat: number, lon: number) => {
			onLocationChange({ latitude: roundCoord(lat), longitude: roundCoord(lon) });
			try {
				const result = await reverseGeocode(lat, lon);
				if (result) applyGeocodeResult(result, regions, onLocationChange);
			} catch {}
		},
		[regions, onLocationChange],
	);

	const handleExistingLocationSelect = useCallback(
		(loc: LocationWithStations) => {
			onLocationChange({
				latitude: loc.latitude,
				longitude: loc.longitude,
				city: loc.city ?? undefined,
				address: loc.address ?? undefined,
				region_id: loc.region?.id ?? null,
			});
		},
		[onLocationChange],
	);

	const hasCoordinates = location.latitude !== null && location.longitude !== null;

	const [initialView] = useState(() => {
		const has = location.longitude != null && location.latitude != null;
		return {
			center: (has ? [location.longitude, location.latitude] : POLAND_CENTER) as [number, number],
			zoom: has ? 15 : 6,
		};
	});

	return (
		<div className="border rounded-xl overflow-hidden">
			<div className="px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2">
				<HugeiconsIcon icon={Location01Icon} className="size-4 text-primary" />
				<span className="font-semibold text-sm">{t("locationPicker.title")}</span>
			</div>

			<div className="h-75 lg:h-87.5 relative">
				<MapGL center={initialView.center} zoom={initialView.zoom}>
					<PickerMapInner location={location} onCoordinatesSet={handleMapCoordinatesSet} onExistingLocationSelect={handleExistingLocationSelect} />
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
							{t("locationPicker.latitude")}
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
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="longitude" className="text-xs">
							{t("locationPicker.longitude")}
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
					</div>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="region" className="text-xs">
						{t("locationPicker.region")}
					</Label>
					<Select
						value={location.region_id?.toString() ?? ""}
						onValueChange={(value) => onLocationChange({ region_id: value ? Number.parseInt(value, 10) : null })}
					>
						<SelectTrigger className={`h-8 text-sm ${errors?.region_id ? "border-destructive" : ""}`}>
							<SelectValue>
								{location.region_id ? regions.find((r) => r.id === location.region_id)?.name : t("locationPicker.selectRegion")}
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
							{t("locationPicker.city")}
						</Label>
						<Input
							id="city"
							placeholder={t("locationPicker.cityPlaceholder")}
							value={location.city ?? ""}
							onChange={(e) => onLocationChange({ city: e.target.value })}
							className="h-8 text-sm"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="address" className="text-xs">
							{t("locationPicker.address")}
						</Label>
						<Input
							id="address"
							placeholder={t("locationPicker.addressPlaceholder")}
							value={location.address ?? ""}
							onChange={(e) => onLocationChange({ address: e.target.value })}
							className="h-8 text-sm"
						/>
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

type PickerMapInnerProps = {
	location: ProposedLocationForm;
	onCoordinatesSet: (lat: number, lon: number) => void;
	onExistingLocationSelect: (loc: LocationWithStations) => void;
};

function PickerMapInner({ location, onCoordinatesSet, onExistingLocationSelect }: PickerMapInnerProps) {
	const { t } = useTranslation("submissions");
	const { map, isLoaded } = useMap();
	const { bounds } = useMapBounds({ map, isLoaded, debounceMs: 500 });
	const [nearbyPanel, setNearbyPanel] = useState<NearbyPanel | null>(null);

	const lastInternalCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
	const addedImagesRef = useRef(new Set<string>());

	const { data: viewportLocations = [] } = useQuery({
		queryKey: ["picker-locations", bounds],
		queryFn: () => fetchLocationsInViewport(bounds),
		enabled: !!bounds,
		staleTime: 1000 * 60 * 2,
		placeholderData: (prev) => prev,
	});

	const geoJSON = useMemo(() => locationsToPickerGeoJSON(viewportLocations), [viewportLocations]);

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
			try {
				map.off("styledata", ensureLayersExist);

				for (const layerId of PICKER_LAYER_IDS) {
					map.off("mouseenter", layerId, handleMouseEnter);
					map.off("mouseleave", layerId, handleMouseLeave);
					if (map.getLayer(layerId)) map.removeLayer(layerId);
				}
				if (map.getSource(PICKER_SOURCE_ID)) map.removeSource(PICKER_SOURCE_ID);
			} catch {}

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

		const handleMapClick = (e: maplibregl.MapMouseEvent) => {
			const features = map.queryRenderedFeatures(e.point, { layers: [...PICKER_LAYER_IDS] });

			if (features.length > 0) {
				const locationId = features[0].properties?.locationId;
				const loc = viewportLocations.find((l) => l.id === locationId);
				if (loc) {
					lastInternalCoordsRef.current = { lat: loc.latitude, lng: loc.longitude };
					onExistingLocationSelect(loc);
					setNearbyPanel(null);
				}
				return;
			}

			const { lat, lng } = e.lngLat;
			const nearby = computeNearby({ lat, lng }, viewportLocations);

			if (nearby.length > 0) {
				setNearbyPanel({ coords: { lat, lng }, locations: nearby });
			} else {
				setNearbyPanel(null);
				lastInternalCoordsRef.current = { lat, lng };
				onCoordinatesSet(lat, lng);
			}
		};

		map.on("click", handleMapClick);
		return () => {
			map.off("click", handleMapClick);
		};
	}, [map, isLoaded, viewportLocations, onCoordinatesSet, onExistingLocationSelect]);

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
			setNearbyPanel(null);
		},
		[onExistingLocationSelect],
	);

	const handleCreateNewHere = useCallback(() => {
		if (!nearbyPanel) return;
		lastInternalCoordsRef.current = nearbyPanel.coords;
		onCoordinatesSet(nearbyPanel.coords.lat, nearbyPanel.coords.lng);
		setNearbyPanel(null);
	}, [nearbyPanel, onCoordinatesSet]);

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
								<button type="button" onClick={() => setNearbyPanel(null)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
									<HugeiconsIcon icon={Cancel01Icon} className="size-3" />
								</button>
							</div>
							<div className="max-h-28 overflow-y-auto">
								{nearbyPanel.locations.map((loc) => (
									<button
										key={loc.id}
										type="button"
										onClick={() => handleSelectNearby(loc)}
										className="w-full flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-accent transition-colors text-left border-b last:border-b-0"
									>
										<HugeiconsIcon icon={Location01Icon} className="size-3 shrink-0 text-muted-foreground" />
										<div className="min-w-0 flex-1">
											<div className="text-xs font-medium truncate">{loc.address || loc.city || `#${loc.id}`}</div>
											<div className="text-[10px] text-muted-foreground leading-tight">
												{t("locationPicker.stationsCount", { count: loc.stations?.length ?? 0 })} · {Math.round(loc.distance)}m
											</div>
										</div>
									</button>
								))}
							</div>
							<button
								type="button"
								onClick={handleCreateNewHere}
								className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors border-t"
							>
								<HugeiconsIcon icon={Add01Icon} className="size-3" />
								{t("locationPicker.createNewLocation")}
							</button>
						</div>
					</MarkerContent>
				</MapMarker>
			)}
		</>
	);
}
