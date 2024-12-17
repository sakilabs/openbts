import { Marker as LMarker, popup as LPopup } from "leaflet";
import { marked } from "marked";

import Popup from "../components/popup.vue";

import type { Map as LeafletMapType, Marker } from "leaflet";

interface CustomMarkerOptions {
	stations: {
		owner: number;
		bts_id: number;
		location_type: string;
	}[];
}

interface CustomLeaflet extends LeafletMapType {
	_layers: Record<string, unknown>;
}

export const capitalize = (str: string) => {
	if (!str?.trim() || str?.trim()?.startsWith("-") || str?.trim()?.endsWith("-")) return null;
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const colorOwner = (station: { owner: number }, type: "bg" | "text") => {
	switch (type) {
		case "bg":
			return station.owner === 1 ? "bg-[#ffa500]" : "bg-[#E20074]";
		case "text":
			return station.owner === 1 ? "text-[#ffa500]" : "text-[#E20074]";
	}
};

export const bindPopupToMarker = async (marker: Marker<unknown>) => {
	const latLng = marker.getLatLng();
	const stations = (marker.options as CustomMarkerOptions)?.stations;
	marker.bindPopup(LPopup().setContent("Ładowanie..."));
	const { app, container } = await renderComponentToString(
		Popup,
		{
			lat: latLng.lat,
			lng: latLng.lng,
			stations,
		},
		[useRouter()],
	);

	const popup = marker.bindPopup(LPopup().setContent(container));
	marker.openPopup();

	popup.on("popupclose", () => {
		app.unmount();
	});
};

export const parseMarked = (string: string): string => {
	const stringToHtml = marked.parse(string, { breaks: true }) as string;
	return stringToHtml;
};

export const findMarker = (mapObj: ReturnType<typeof leafletMap>, options: { latlng?: number[]; bts_id?: number }) => {
	const markers = Object.values((mapObj.value.leafletObject as CustomLeaflet)._layers).filter((layer) => layer instanceof LMarker);
	const marker = markers.find(
		(layer) =>
			(options.latlng?.length && layer.getLatLng().lat === options.latlng?.[0] && layer.getLatLng().lng === options.latlng?.[1]) ||
			(options.bts_id && (layer.options as CustomMarkerOptions).stations?.some((station) => station.bts_id === options.bts_id)),
	);

	return marker;
};
