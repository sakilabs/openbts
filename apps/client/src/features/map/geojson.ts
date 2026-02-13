import type { StationSource, LocationWithStations, UkeLocationWithPermits, RadioLine } from "@/types/station";
import { getOperatorColor, resolveOperatorMnc } from "@/lib/operatorUtils";
import { calculateDistance, formatDistance, formatFrequency } from "./utils";
import { isPermitExpired } from "@/lib/dateUtils";

export const DEFAULT_COLOR = "#3b82f6";

type OperatorMnc = number | null | undefined;

export function getOperatorData(mncs: OperatorMnc[]) {
	const operators = [...new Set(mncs.filter((mnc): mnc is number => mnc !== null))].sort((a, b) => a - b);
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

export function radioLinesToGeoJSON(radioLines: RadioLine[]): {
	lines: GeoJSON.FeatureCollection;
	endpoints: GeoJSON.FeatureCollection;
} {
	const lineFeatures: GeoJSON.Feature[] = [];
	const endpointFeatures: GeoJSON.Feature[] = [];

	for (const rl of radioLines) {
		const mnc = resolveOperatorMnc(rl.operator?.mnc, rl.operator?.name);
		const color = mnc ? getOperatorColor(mnc) : DEFAULT_COLOR;
		const isExpired = isPermitExpired(rl.permit.expiry_date);
		const distance = calculateDistance(rl.tx.latitude, rl.tx.longitude, rl.rx.latitude, rl.rx.longitude);
		const distanceFormatted = formatDistance(distance);

		lineFeatures.push({
			type: "Feature",
			geometry: {
				type: "LineString",
				coordinates: [
					[rl.tx.longitude, rl.tx.latitude],
					[rl.rx.longitude, rl.rx.latitude],
				],
			},
			properties: {
				radioLineId: rl.id,
				freq: rl.link.freq,
				freqFormatted: formatFrequency(rl.link.freq),
				operatorName: rl.operator?.name ?? "",
				operatorMnc: rl.operator?.mnc ?? null,
				color,
				bandwidth: rl.link.bandwidth ?? "",
				ch_width: rl.link.ch_width ?? null,
				polarization: rl.link.polarization ?? "",
				isExpired,
				distanceFormatted,
			},
		});

		endpointFeatures.push(
			createPointFeature(rl.tx.longitude, rl.tx.latitude, {
				radioLineId: rl.id,
				role: "tx",
				color,
			}),
			createPointFeature(rl.rx.longitude, rl.rx.latitude, {
				radioLineId: rl.id,
				role: "rx",
				color,
			}),
		);
	}

	return {
		lines: { type: "FeatureCollection", features: lineFeatures },
		endpoints: { type: "FeatureCollection", features: endpointFeatures },
	};
}
