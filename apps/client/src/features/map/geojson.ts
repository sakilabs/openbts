import type { Station, StationSource, LocationWithStations } from "@/types/station";
import { getOperatorColor } from "@/lib/operator-utils";

const DEFAULT_COLOR = "#3b82f6";

type OperatorMnc = number | null | undefined;

function getOperatorData(mncs: OperatorMnc[]) {
	const operators = [...new Set(mncs.filter((mnc): mnc is number => mnc != null))].sort((a, b) => a - b);
	const isMultiOperator = operators.length > 1;

	return {
		operators,
		isMultiOperator,
		pieImageId: isMultiOperator ? `pie-${operators.join("-")}` : undefined,
		color: operators.length > 0 ? getOperatorColor(operators[0]) : DEFAULT_COLOR,
	};
}

function createPointFeature(
	lng: number,
	lat: number,
	properties: GeoJSON.GeoJsonProperties,
): GeoJSON.Feature {
	return {
		type: "Feature",
		geometry: { type: "Point", coordinates: [lng, lat] },
		properties,
	};
}

export function locationsToGeoJSON(locations: LocationWithStations[], source: StationSource): GeoJSON.FeatureCollection {
	const features: GeoJSON.Feature[] = [];

	for (const location of locations) {
		if (location.latitude == null || location.longitude == null || !location.stations?.length) continue;

		const { operators, isMultiOperator, pieImageId, color } = getOperatorData(
			location.stations.map((s) => s.operator?.mnc),
		);

		features.push(
			createPointFeature(location.longitude, location.latitude, {
				locationId: location.id,
				source,
				city: location.city,
				address: location.address,
				stationCount: location.stations.length,
				operatorCount: operators.length,
				operators: JSON.stringify(operators),
				color,
				isMultiOperator,
				pieImageId,
			}),
		);
	}

	return { type: "FeatureCollection", features };
}

export function stationsToGeoJSON(items: Station[], source: StationSource): GeoJSON.FeatureCollection {
	const groups = new Map<string, Station[]>();

	for (const item of items) {
		const lat = item.location?.latitude ?? (item as any).latitude;
		const lng = item.location?.longitude ?? (item as any).longitude;
		if (lat == null || lng == null) continue;

		const key = `${lng.toFixed(6)},${lat.toFixed(6)}`;
		const group = groups.get(key) ?? [];
		group.push(item);
		groups.set(key, group);
	}

	const features: GeoJSON.Feature[] = [];

	for (const [, groupItems] of groups) {
		const first = groupItems[0];
		const lat = first.location?.latitude ?? (first as any).latitude;
		const lng = first.location?.longitude ?? (first as any).longitude;

		const { operators, isMultiOperator, pieImageId, color } = getOperatorData(
			groupItems.map((s) => s.operator?.mnc),
		);

		features.push(
			createPointFeature(lng, lat, {
				stations: JSON.stringify(groupItems),
				source,
				locationId: first.id,
				stationCount: groupItems.length,
				operatorCount: operators.length,
				operators: JSON.stringify(operators),
				color,
				isMultiOperator,
				pieImageId,
			}),
		);
	}

	return { type: "FeatureCollection", features };
}
