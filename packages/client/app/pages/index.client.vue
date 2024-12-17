<template>
	<ClientOnly>
		<LMap
			ref="mapObj"
			:style="{ height: $device.isSafari ? '-webkit-fill-available' : '100vh', width: '100vw' }"
			:zoom="7"
			:center="[53.502197, 18.77796]"
			:use-global-leaflet="true"
			:options="{ zoomControl: false }"
			@ready="onMapReady"
		>
			<LTileLayer
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				attribution='&amp;copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
				layer-type="base"
				name="OpenStreetMap"
			/>
			<LControlZoom position="bottomright" />
		</LMap>
	</ClientOnly>
</template>

<script setup lang="tsx">
import { LatLng } from "leaflet";
import { leafletMap } from "@/composables/leafletMap.js";
import { db } from "@/composables/indexeddb.js";

import type { Marker } from "leaflet";
import type { BTSStation } from "@/interfaces/bts.js";

const router = useRouter();
const list = currentUserList();
list.value = null;
const cookie = useCookie("token", { expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365) });
if (!cookie.value) router.push("/auth");

const getStationList = async () => {
	const cacheData = await db.btsList.toArray();
	if (cacheData.length) return cacheData;
	const { data, error } = await useCustomFetch<{ success: boolean; data?: BTSStation[]; error?: string }>("/btsList", {
		headers: cookie.value ? { Authorization: `Bearer ${cookie.value}` } : undefined,
	});
	if (!data?.value?.success || error?.value?.data || !data?.value?.data) return [];

	const stations = data?.value?.data;
	db.btsList.bulkPut(data?.value?.data);
	return stations;
};
clearNuxtState("mapObj");
const mapObj = leafletMap();
const stationList: Stations[] = await getStationList();
const locations: { name: string; lat: number; lng: number }[] = [];
const locationMap = new Map<
	string,
	{
		name: string;
		lat: number;
		lng: number;
		options: { draggable: boolean; stations: { owner: number; bts_id: number; location_type: string | null }[] };
	}
>();

for (const location of stationList) {
	const station_id = location.bts_id;
	const longitude = location.longitude;
	const latitude = location.latitude;
	const owner = location.owner;
	const location_type = location.location_type;

	const locationKey = `${latitude},${longitude}`;
	if (locationMap.has(locationKey)) {
		const existingLocation = locationMap.get(locationKey);
		existingLocation?.options.stations.push({ owner, bts_id: station_id, location_type });
	} else {
		const lat = Number.parseFloat(latitude);
		const lng = Number.parseFloat(longitude);
		locationMap.set(locationKey, {
			name: `${lat},${lng}`,
			lat,
			lng,
			options: {
				draggable: false,
				stations: [{ owner, bts_id: station_id, location_type }],
			},
		});
	}
}

for (const location of locationMap.values()) {
	locations.push(location);
}

const defaultCoords = { latitude: 53.502197, longitude: 18.77796, zoom: 7 };
const isLocating = ref(false);
const isValidCoordinate = (value: number): boolean => {
	return typeof value === "number" && Number.isFinite(value);
};
const setupGeolocation = async () => {
	const { coords, locatedAt, error } = useGeolocation();

	isLocating.value = true;
	const timeoutPromise = new Promise((_, reject) => {
		setTimeout(() => reject(new Error("Geolocation timeout")), 5000);
	});

	try {
		await Promise.race([new Promise((resolve) => watch(locatedAt, resolve, { once: true })), timeoutPromise]);

		const latitude = coords.value.latitude;
		const longitude = coords.value.longitude;
		if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) return defaultCoords;

		return { latitude, longitude, zoom: 13 };
	} catch (e) {
		console.warn("Geolocation failed:", error.value);
	} finally {
		isLocating.value = false;
	}
};

const onMapReady = async () => {
	const { markerCluster } = await useMarkerCluster({
		leafletObject: mapObj.value.leafletObject,
		markers: locations,
	});

	markerCluster.on("click", async (marker: { sourceTarget: Marker<unknown> }) => {
		const sourceMarker = marker.sourceTarget;
		await bindPopupToMarker(sourceMarker);
	});

	const coords = await setupGeolocation();
	if (coords) mapObj.value.leafletObject.setView(new LatLng(coords.latitude, coords.longitude), coords.zoom);
};
</script>
