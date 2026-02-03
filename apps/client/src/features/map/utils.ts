import type { Cell, UkePermit, UkeStation, UkeLocationWithPermits } from "@/types/station";
import { RAT_ORDER } from "./constants";

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

function sortBands(bands: string[]): string[] {
	return bands.sort((a, b) => {
		const matchA = a.match(/^([A-Za-z]+)(\d+)$/);
		const matchB = b.match(/^([A-Za-z]+)(\d+)$/);

		if (!matchA || !matchB) return a.localeCompare(b);

		const [, ratA, freqA] = matchA;
		const [, ratB, freqB] = matchB;

		const indexA = RAT_ORDER.indexOf(ratA.toUpperCase() as (typeof RAT_ORDER)[number]);
		const indexB = RAT_ORDER.indexOf(ratB.toUpperCase() as (typeof RAT_ORDER)[number]);

		if (indexA !== indexB) return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);

		return Number.parseInt(freqA, 10) - Number.parseInt(freqB, 10);
	});
}

export function getStationBands(cells: Cell[]): string[] {
	const bands = [...new Set(cells.map((c) => `${c.rat}${c.band.value}`))];
	return sortBands(bands);
}

export function getPermitBands(permits: UkePermit[]): string[] {
	const bands = [...new Set(permits.filter((p) => p.band != null).map((p) => `${p.band?.rat}${p.band?.value}`))];
	return sortBands(bands);
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371e3; // Earth radius
	const radLat1 = (lat1 * Math.PI) / 180;
	const radLat2 = (lat2 * Math.PI) / 180;
	const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
	const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

	const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
}

export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const radLat1 = (lat1 * Math.PI) / 180;
	const radLat2 = (lat2 * Math.PI) / 180;
	const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

	const y = Math.sin(deltaLon) * Math.cos(radLat2);
	const x = Math.cos(radLat1) * Math.sin(radLat2) - Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(deltaLon);
	const theta = Math.atan2(y, x);

	return ((theta * 180) / Math.PI + 360) % 360;
}

export function calculateTA(distanceMeters: number) {
	// GSM TA: ~554m per step
	const gsm = Math.max(0, Math.round(distanceMeters / 554));
	// UMTS (Chips): ~78.12m per chip (One way)
	const umts = Math.max(0, Math.round(distanceMeters / 78.125));
	// LTE TA: ~78.12m per step
	const lte = Math.max(0, Math.round(distanceMeters / 78.125));
	// NR TA (SCS 30kHz): ~39.06m per step
	const nr = Math.max(0, Math.round(distanceMeters / 39.0625));

	return { gsm, umts, lte, nr };
}
