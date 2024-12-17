import { Marker, MarkerClusterGroup } from "leaflet";
import "leaflet.markercluster";

import type { Map as LeafletMap, MarkerOptions } from "leaflet";

interface MarkerProps {
	name?: string;
	lat: number;
	lng: number;
	options?: MarkerOptions;
	popup?: string;
}

interface Props {
	leafletObject: LeafletMap;
	markers: MarkerProps[];
}

export const useMarkerCluster = (props: Props) => {
	const markerCluster = new MarkerClusterGroup({
		maxClusterRadius: 80,
		spiderfyOnMaxZoom: false,
		removeOutsideVisibleBounds: true,
		disableClusteringAtZoom: 18,
	});

	const markers = new Map();
	const markersArray = [];

	for (const location of props.markers) {
		const marker = new Marker([location.lat, location.lng], {
			title: location.name,
			...location.options,
		});

		const markerId = location.name || `${location.lat}-${location.lng}`;
		markers.set(markerId, marker);
		markersArray.push(marker);
	}

	markerCluster.addLayers(markersArray);
	props.leafletObject.addLayer(markerCluster);

	return { markerCluster, markers };
};
