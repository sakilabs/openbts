<template>
	<div v-if="!errorOccured">
		<p class="text-xs">Ta lokalizacja ma {{ props.stations.length }} stacj{{ stations.length === 1 ? "ę" : "e" }}</p>
		<p class="text-xs">
			<span v-if="locationTypes.length">{{ locationTypes.join(" / ") }}</span>
		</p>
		<div v-for="station in props.stations.slice(0, 5)">
			<p class="inline">
				<span
					class="inline-flex items-center justify-center w-3 h-3 text-sm font-semibold rounded-full mr-2"
					:class="colorOwner(station, 'bg')"
					:title="`Stacja ${station.owner === 1 ? 'Orange' : 'T-Mobile'}`"
				></span>
				<abbr
					class="inline text-bold text-lg cursor-help"
					:class="colorOwner(station, 'text')"
					:title="`Stacja ${station.owner === 1 ? 'Orange' : 'T-Mobile'}. Numer wewnętrzny w naszej bazie.`"
					>{{ station.bts_id }}</abbr
				>
				<ListDropdown :bts_id="station.bts_id" icon="heroicons:plus-circle-16-solid"></ListDropdown>
			</p>
			<p class="text-sm" v-if="station.btsDetails?.mno?.mno_id">
				mno: <code>{{ station.btsDetails?.mno.mno_id }}</code> ({{ station.btsDetails?.mno?.mno_name }})
			</p>
			<p class="text-sm" v-if="station.btsDetails?.networks?.networks_id">
				networks: <code>{{ station.btsDetails?.networks.networks_id }}</code>
			</p>
			<a href="#" @click="openSlideover(station)">Pokaż więcej szczegółów <UIcon name="flowbite:arrow-up-right-from-square-outline" /></a>
			<hr class="mt-0 mb-0 h-0.5 text-gray-400 border-dashed" />
		</div>
		<p class="text-xs mt-0 pt-0">
			GPS:
			<a
				class="text-blue-600 hover:text-blue-700 transition-colors link-underline hover:link-underline"
				target="_blank"
				:href="`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`"
				>{{ lat }},{{ lng }} <UIcon name="flowbite:arrow-up-right-from-square-outline"
			/></a>
		</p>
	</div>
	<div v-else>
		<p>Wystąpił błąd podczas pobierania danych... Spróbuj ponownie za chwilę.</p>
	</div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";

import { colorOwner } from "@/utils/helpers.js";
import Slideover from "@/components/slideover.vue";

import type { BTSStationSpecificDetails } from "@/interfaces/bts.js";

const cookie = useCookie("token");
const props = defineProps<{
	lat: number;
	lng: number;
	stations: {
		owner: number;
		bts_id: number;
		location_type: string;
		type: string;
		btsDetails: BTSStationSpecificDetails | null;
	}[];
}>();
const errorOccured = ref(false);
const locationTypes: string[] = [];
const slideover = useSlideover();
const emit = defineEmits(["ready"]);

function openSlideover(station: {
	owner: number;
	bts_id: number;
	type: string;
	location_type: string;
	btsDetails: BTSStationSpecificDetails | null;
}) {
	slideover.open(Slideover, {
		lng: props.lng,
		lat: props.lat,
		station,
	});
}

const getBTSDetails = async (bts_id: number): Promise<BTSStationSpecificDetails | null> => {
	const { data, error } = await useCustomFetch<{ success: boolean; data: BTSStationSpecificDetails | null; error?: string }>(
		`/bts/${bts_id.toString()}`,
		{
			headers: cookie.value ? { Authorization: `Bearer ${cookie.value}` } : undefined,
		},
	);
	if (!data?.value?.success || error?.value?.data) {
		errorOccured.value = true;
		return null;
	}

	return data?.value?.data;
};

//* Show only 5 stations in the popup if they are at the same location
for (const station of props.stations.slice(0, 5)) {
	const locationType = capitalize(station.location_type);
	locationType && !locationTypes.includes(locationType) && locationTypes.push(locationType);
	const btsDetails = await getBTSDetails(station.bts_id);
	const foundStation = props.stations.find((val) => val.bts_id === station.bts_id);
	if (foundStation) foundStation.btsDetails = btsDetails;
}

onMounted(() => {
	emit("ready");
});
</script>
