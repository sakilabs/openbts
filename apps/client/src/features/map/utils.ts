import type { Cell, UkePermit, UkeStation, UkeLocationWithPermits, RadioLine } from "@/types/station";
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
        location: !location ? (permit.location ?? null) : location,
      });
    }
  }

  return Array.from(stationMap.values());
}

function sortBands(bands: string[]): string[] {
  return bands.sort((a, b) => {
    const matchA = a.match(/^([A-Za-z]+(?:-[A-Za-z]+)?)(\d+)$/);
    const matchB = b.match(/^([A-Za-z]+(?:-[A-Za-z]+)?)(\d+)$/);

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
  const bands = [
    ...new Set(
      permits
        .filter((p) => p.band !== null)
        .map((p) => {
          const rat = p.band?.rat === "GSM" && p.band?.variant === "railway" ? "GSM-R" : p.band?.rat;
          return `${rat}${p.band?.value}`;
        }),
    ),
  ];
  return sortBands(bands);
}

export function formatBandwidth(bandwidth: string): string {
  const num = Number(bandwidth);
  if (Number.isNaN(num)) return bandwidth;
  if (num >= 1000) return `${(num / 1000).toFixed(2)} Gb/s`;
  return `${num} Mb/s`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

export function formatFrequency(freqMhz: number): string {
  if (freqMhz >= 1000) {
    const ghz = freqMhz / 1000;
    return `${Number.isInteger(ghz) ? ghz : ghz.toFixed(1)} GHz`;
  }
  return `${freqMhz} MHz`;
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

export function findColocatedRadioLines(target: RadioLine, all: RadioLine[]): RadioLine[] {
  const txLat = target.tx.latitude;
  const txLng = target.tx.longitude;
  const rxLat = target.rx.latitude;
  const rxLng = target.rx.longitude;

  const operatorId = target.operator?.id;

  return all.filter((rl) => {
    if (rl.operator?.id !== operatorId) return false;
    const matchForward = rl.tx.latitude === txLat && rl.tx.longitude === txLng && rl.rx.latitude === rxLat && rl.rx.longitude === rxLng;
    const matchReverse = rl.tx.latitude === rxLat && rl.tx.longitude === rxLng && rl.rx.latitude === txLat && rl.rx.longitude === txLng;
    return matchForward || matchReverse;
  });
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
