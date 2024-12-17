import type { Map as LeafletMap, Marker, MarkerClusterGroup } from "leaflet";

export const leafletMap = () => {
	return useState<{ leafletObject: LeafletMap; markers: Marker<unknown>[] }>("mapObj");
};

export const leafletListMap = () => {
	return useState<{ leafletObject: LeafletMap; markers: Marker<unknown>[] }>("mapListObj");
};

export const markerClusterList = () => {
	return useState<MarkerClusterGroup>("markerClusterList");
};
