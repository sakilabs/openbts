import type { StationSource, LocationWithStations, UkeLocationWithPermits, RadioLine } from "@/types/station";
import { getOperatorColor, resolveOperatorMnc } from "@/lib/operatorUtils";
import { calculateDistance, formatDistance, formatFrequency, formatBandwidth, groupRadioLinesIntoLinks } from "./utils";

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
  const links = groupRadioLinesIntoLinks(radioLines);
  const lineFeatures: GeoJSON.Feature[] = [];
  const endpointFeatures: GeoJSON.Feature[] = [];

  for (const link of links) {
    const first = link.directions[0];
    const mnc = resolveOperatorMnc(first.operator?.mnc, first.operator?.name);
    const color = mnc ? getOperatorColor(mnc) : DEFAULT_COLOR;
    const distance = calculateDistance(link.a.latitude, link.a.longitude, link.b.latitude, link.b.longitude);
    const distanceFormatted = formatDistance(distance);

    const directionsJson = JSON.stringify(
      link.directions.map((d) => ({
        freq: formatFrequency(d.link.freq),
        bandwidth: d.link.bandwidth ? formatBandwidth(d.link.bandwidth) : null,
        forward: d.tx.latitude === link.a.latitude && d.tx.longitude === link.a.longitude,
      })),
    );

    lineFeatures.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [link.a.longitude, link.a.latitude],
          [link.b.longitude, link.b.latitude],
        ],
      },
      properties: {
        groupId: link.groupId,
        radioLineId: first.id,
        operatorName: first.operator?.name ?? "",
        operatorMnc: first.operator?.mnc ?? null,
        color,
        isExpired: link.isExpired,
        distanceFormatted,
        directionsJson,
        directionCount: link.directions.length,
      },
    });

    endpointFeatures.push(
      createPointFeature(link.a.longitude, link.a.latitude, {
        groupId: link.groupId,
        radioLineId: first.id,
        color,
      }),
      createPointFeature(link.b.longitude, link.b.latitude, {
        groupId: link.groupId,
        radioLineId: first.id,
        color,
      }),
    );
  }

  return {
    lines: { type: "FeatureCollection", features: lineFeatures },
    endpoints: { type: "FeatureCollection", features: endpointFeatures },
  };
}
