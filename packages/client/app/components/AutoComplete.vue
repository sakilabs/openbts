<template>
	<Combobox v-model="inputValue">
		<div class="relative w-full">
			<div class="w-full overflow-hidden rounded-lg text-left focus:outline-none sm:text-sm border border-gray-300 dark:border-gray-600">
				<ComboboxInput
					class="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:outline-none dark:text-white bg-white dark:bg-[#0f172a]"
					@input="onInput"
					@change="query = $event.target.value"
					placeholder="Wpisz nazwę lub ID MNO/NetWorkS!"
				/>
			</div>
			<TransitionRoot leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" @after-leave="clearResults">
				<ComboboxOptions
					v-if="results.length !== 0"
					class="absolute mt-1 max-h-96 w-full max-w-2xl overflow-auto rounded-md bg-white dark:bg-[#0f172a] focus:outline-none border border-gray-300 dark:border-gray-600 text-left z-50"
				>
					<ComboboxOption
						v-for="station in results"
						:key="station.item.bts_id"
						:value="station.item.bts_id"
						v-slot="{ active }"
						@click="jumpToMarker(Number.parseFloat(station.item.latitude), Number.parseFloat(station.item.longitude), station.item)"
					>
						<li
							class="relative select-none py-1 pr-4 px-4 text-gray-900 dark:text-white"
							:class="{
								'bg-gray-500 text-white': active,
								'text-gray-900 dark:text-white': !active,
							}"
						>
							<p class="truncate text-sm">
								<span
									class="inline-flex items-center justify-center w-3 h-3 text-sm font-semibold rounded-full mr-2"
									:class="colorOwner(station.item, 'bg')"
									:title="`Stacja ${station.item.owner === 1 ? 'Orange' : 'T-Mobile'}`"
								></span
								>{{ returnMessage(station) }}
							</p>
							<p class="truncate text-xs">
								<span>{{
									returnMatchKey(station.matches) === Match.MNO
										? `NetWorkS: ${station.item.networks_id ?? "Brak"}`
										: `MNO: ${station.item.mno_id ?? "Brak"}`
								}}</span>
								• GPS: {{ station.item.latitude }},{{ station.item.longitude }}
							</p>
						</li>
					</ComboboxOption>
				</ComboboxOptions>
			</TransitionRoot>
		</div>
	</Combobox>
</template>
<script setup lang="ts">
import Fuse, { type FuseResult, type FuseResultMatch } from "fuse.js";
import { Marker, latLng, type MarkerOptions } from "leaflet";
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption, TransitionRoot } from "@headlessui/vue";
import { leafletMap } from "@/composables/leafletMap.js";

import type { BTSStation } from "@/interfaces/bts.js";

const inputValue = ref("");
const query = ref("");
const results = ref<FuseResult<SearchBTSStation>[]>([]);
const typingTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const mapObj = leafletMap();
const idMapObj = leafletListMap();
const route = useRoute();
const list = currentUserList();

enum Match {
	MNO = "mno",
	NETWORKS = "networks",
}

interface CustomMarkerOptions extends MarkerOptions {
	stations?: { owner: number; bts_id: number; location_type: string }[];
}

interface SearchBTSStation extends BTSStation {
	networks_name?: string;
	mno_name?: string;
}

const returnMessage = (station: FuseResult<SearchBTSStation>) => {
	const mnoName = station.item?.mno_name;
	const networksName = station.item?.networks_name;
	if (returnMatchKey(station.matches) === Match.MNO) return `MNO ID: ${station.item.mno_id} ${mnoName ? `• ${mnoName?.slice(0, 20) ?? ""}` : ""}`;
	return `NetWorkS ID: ${station.item.networks_id} ${networksName ? `• ${networksName?.slice(0, 20) ?? ""}` : ""}`;
};

const returnMatchKey = (matches: readonly FuseResultMatch[] | undefined): string => {
	if (!matches || !matches.length) return "";
	const match = matches[0];
	if (!match) return "";
	if (["mno_name", "mno_id"].includes(match.key as string)) return Match.MNO;
	if (["networks_name", "networks_id"].includes(match.key as string)) return Match.NETWORKS;
	return "";
};

const onInput = () => {
	results.value = [];
	if (typingTimeout.value !== null) clearTimeout(typingTimeout.value);
	typingTimeout.value = setTimeout(async () => {
		if (!query.value || query.value.length < 2) return;
		const res = await fetchResults(query.value.toLowerCase());
		if (!res) return;

		const fuzzySearch = new Fuse(res, {
			keys: [{ weight: 2, name: "networks_id" }, { weight: 2, name: "networks_name" }, "mno_name", "mno_id"],
			threshold: 0.3,
			includeScore: true,
			includeMatches: true,
		});
		const fuzzyRes = fuzzySearch.search(query.value);
		if (!fuzzyRes.length) return;
		results.value = fuzzyRes.slice(0, 50);
	}, 200);
};

const fetchResults = async (query: string): Promise<SearchBTSStation[] | null> => {
	const cookie = useCookie("token");
	const { data, error } = await useCustomFetch<{ success: boolean; data: SearchBTSStation[] | null; error?: string }>("/search", {
		method: "POST",
		body: JSON.stringify({ searchQuery: query }),
		headers: cookie.value ? { Authorization: `Bearer ${cookie.value}` } : undefined,
	});
	if (!data?.value?.success || error?.value?.data || !data?.value?.data) return null;
	return data?.value?.data;
};

const clearResults = () => {
	query.value = "";
	if (typingTimeout.value !== null) clearTimeout(typingTimeout.value);
	results.value = [];
};

const jumpToMarker = async (lat: number, lng: number, station: SearchBTSStation) => {
	const isList = route.fullPath.includes("/lists");
	const map = isList ? idMapObj : mapObj;
	if (isList && !findMarker(map, { latlng: [lat, lng] })) {
		new Marker([lat, lng], {
			title: `${lat},${lng}`,
			draggable: false,
			stations: [{ owner: station.owner, bts_id: station.bts_id, location_type: station.location_type }],
		} as CustomMarkerOptions).addTo(map.value.leafletObject);
	}

	map.value.leafletObject.setView(latLng(lat, lng), isList ? 13 : 18);
	const marker = findMarker(map, { latlng: [lat, lng] });
	if (!marker) return;
	await bindPopupToMarker(marker);
	const markerStations = (marker.options as CustomMarkerOptions).stations ?? [];
	const shouldAddEvent = markerStations.some((station) => list?.value?.stations.includes(station.bts_id));
	if (isList && !shouldAddEvent) {
		marker.on("popupclose", () => {
			marker.unbindPopup();
			marker.remove();
			marker.removeEventListener("popupclose");
		});
	}
};
</script>
