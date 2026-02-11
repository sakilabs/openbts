import type { StationSource, LocationWithStations, UkeLocationWithPermits } from "@/types/station";
import { getOperatorColor } from "@/lib/operatorUtils";

export const DEFAULT_COLOR = "#3b82f6";

type OperatorMnc = number | null | undefined;

export function getOperatorData(mncs: OperatorMnc[]) {
	const operators = [...new Set(mncs.filter((mnc): mnc is number => mnc != null))].sort((a, b) => a - b);
	const isMultiOperator = operators.length > 1;

	return {
		operators,
		isMultiOperator,
		pieImageId: isMultiOperator ? `pie-${operators.join("-")}` : undefined,
		color: operators.length > 0 ? getOperatorColor(operators[0]) : DEFAULT_COLOR,
	};
}

export function createPointFeature(lng: number, lat: number, properties: GeoJSON.GeoJsonProperties): GeoJSON.Feature {
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

		const { operators, isMultiOperator, pieImageId, color } = getOperatorData(location.stations.map((s) => s.operator?.mnc));

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

export function ukeLocationsToGeoJSON(locations: UkeLocationWithPermits[], source: StationSource): GeoJSON.FeatureCollection {
	const features: GeoJSON.Feature[] = [];

	for (const location of locations) {
		if (location.latitude == null || location.longitude == null || !location.permits?.length) continue;

		const { operators, isMultiOperator, pieImageId, color } = getOperatorData(location.permits.map((p) => p.operator?.mnc));

		features.push(
			createPointFeature(location.longitude, location.latitude, {
				locationId: location.id,
				source,
				city: location.city,
				address: location.address,
				stationCount: location.permits.length,
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
