<template>
	<ClientOnly>
		<LMap
			:style="{ height: $device.isSafari ? '-webkit-fill-available' : '100vh', width: '100vw' }"
			ref="mapObj"
			:zoom="8"
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
			<FooterOverlay :list="list ? list : null" />
		</LMap>
	</ClientOnly>
</template>
<script setup lang="ts">
import { markerClusterList } from "@/composables/leafletMap.js";

import type { Marker } from "leaflet";
import type { userListRequest } from "@/interfaces/requests.js";
import type { BTSStation } from "@/interfaces/bts.js";

const mapObj = leafletListMap();
const route = useRoute();
const cookie = useCookie("token", { expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365) });
const router = useRouter();
const list = currentUserList();
if (!cookie.value) router.push("/auth");

const getList = async (list_uuid: string): Promise<userListRequest | null> => {
	const { data, error } = await useCustomFetch<{
		success: boolean;
		data?: userListRequest;
		error?: string;
	}>(`/lists/${list_uuid}`, {
		headers: cookie.value ? { Authorization: `Bearer ${cookie.value}` } : undefined,
		method: "GET",
	});
	if (!data?.value?.success || error?.value?.data) return null;

	return data?.value.data as userListRequest;
};
list.value = await getList(route.params.id as string);
if (!list.value) router.push("/");

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
const cacheData = await getStationList();
const stations = cacheData.filter((station) => list?.value?.stations.includes(station.bts_id));
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

for (const location of stations) {
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

const onMapReady = async () => {
	const { markerCluster } = await useMarkerCluster({
		leafletObject: mapObj.value.leafletObject,
		markers: locations,
	});

	const markerClusterListObj = markerClusterList();
	markerClusterListObj.value = markerCluster;

	markerCluster.on("click", async (marker: { sourceTarget: Marker<unknown> }) => {
		const sourceMarker = marker.sourceTarget;
		await bindPopupToMarker(sourceMarker);
	});
};
</script>