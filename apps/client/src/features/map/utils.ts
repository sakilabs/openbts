import type { Cell, UkePermit, UkeStation, UkeLocationWithPermits } from "@/types/station";
import { RAT_ORDER } from "./constants";

export function getStationTechs(cells: Cell[]): string[] {
	const techs = [...new Set(cells.map((c) => c.rat))];

	return techs.sort((a, b) => {
		const indexA = RAT_ORDER.indexOf(a as (typeof RAT_ORDER)[number]);
		const indexB = RAT_ORDER.indexOf(b as (typeof RAT_ORDER)[number]);
		return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
	});
}

export function groupPermitsByStation(permits: UkePermit[], ukeLocation?: UkeLocationWithPermits): UkeStation[] {
	const stationMap = new Map<string, UkeStation>();

	const location = ukeLocation
		? {
				city: ukeLocation.city,
				address: ukeLocation.address,
				latitude: ukeLocation.latitude,
				longitude: ukeLocation.longitude,
				region: ukeLocation.region,
			}
		: null;

	for (const permit of permits) {
		const existing = stationMap.get(permit.station_id);
		if (existing) {
			existing.permits.push(permit);
		} else {
			stationMap.set(permit.station_id, {
				station_id: permit.station_id,
				operator: permit.operator ?? null,
				permits: [permit],
				location,
			});
		}
	}

	return Array.from(stationMap.values());
}

export function getPermitTechs(permits: UkePermit[]): string[] {
	const techs = [...new Set(permits.map((p) => p.band?.rat).filter((r): r is string => r != null))];

	return techs.sort((a, b) => {
		const indexA = RAT_ORDER.indexOf(a.toUpperCase() as (typeof RAT_ORDER)[number]);
		const indexB = RAT_ORDER.indexOf(b.toUpperCase() as (typeof RAT_ORDER)[number]);
		return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
	});
}
