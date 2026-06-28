export function buildInternalStationActionUrl(station: {
  id: number;
  location?: { latitude: number; longitude: number } | null;
}): string | undefined {
  if (!station.location) return undefined;
  return `/#map=16.00/${station.location.latitude}/${station.location.longitude}~f~S${station.id}`;
}

export function buildUkeStationActionUrl(station: { id: number; location?: { latitude: number; longitude: number } | null }): string | undefined {
  if (!station.location) return undefined;
  return `/#map=16.00/${station.location.latitude}/${station.location.longitude}~fu~S${station.id}`;
}
