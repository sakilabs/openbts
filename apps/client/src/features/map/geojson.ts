import type { Station, StationSource } from "@/types/station";
import { getOperatorColor } from "@/lib/operator-utils";

export function stationsToGeoJSON(items: Station[], source: StationSource): GeoJSON.FeatureCollection {
	const groups = new Map<string, Station[]>();

	for (const item of items) {
		const lat = item.location?.latitude;
		const lng = item.location?.longitude;

		if (lat === undefined || lng === undefined) continue;

		const key = `${lng.toFixed(6)},${lat.toFixed(6)}`;
		let group = groups.get(key);
		if (!group) {
			group = [];
			groups.set(key, group);
		}
		group.push(item);
	}

	const features: GeoJSON.Feature[] = [];

	for (const [, groupItems] of groups) {
		const first = groupItems[0];
		const operators = [...new Set(groupItems.map((s) => s.operator?.mnc).filter(Boolean))].sort((a, b) => (a as number) - (b as number));
		const isMultiOperator = operators.length > 1;
		const pieImageId = isMultiOperator ? `pie-${operators.join("-")}` : undefined;
		const primaryColor = operators.length > 0 ? getOperatorColor(operators[0] as number) : "#3b82f6";

		const lat = first.location.latitude;
		const lng = first.location.longitude;

		features.push({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [lng, lat],
			},
			properties: {
				stations: JSON.stringify(groupItems),
				source,
				locationId: source === "uke" ? first.id : first.station_id || first.id,
				stationCount: groupItems.length,
				operatorCount: operators.length,
				operators: JSON.stringify(operators),
				color: primaryColor,
				isMultiOperator,
				pieImageId,
			},
		});
	}

	return {
		type: "FeatureCollection",
		features,
	};
}
