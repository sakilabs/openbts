<template>
	<USlideover
		:title="String(station.bts_id)"
		:description="`Stacja ${station.owner === 1 ? 'Orange' : 'T-Mobile'}. ${capitalize(station.location_type)}`"
		:overlay="false"
		close-icon="lucide:arrow-right"
	>
		<template #body v-model="extraBTSDetails">
			<div class="h-full">
				<h1 class="text-lg font-medium mb-1">Dane stacji</h1>
				<div class="grid grid-cols-2 gap-y-6 w-full">
					<div>
						<UBadge color="neutral" variant="outline">Numer MNO</UBadge>
						<p class="text-md">{{ station.btsDetails?.mno?.mno_id ?? "Brak" }}</p>
					</div>
					<div>
						<UBadge color="neutral" variant="outline">Nazwa MNO</UBadge>
						<p class="text-md break-words">{{ station.btsDetails?.mno?.mno_name ?? "Brak" }}</p>
					</div>
					<div>
						<UBadge color="neutral" variant="outline">Numer NetWorkS!</UBadge>
						<p class="text-md">{{ station.btsDetails?.networks?.networks_id ?? "Brak" }}</p>
					</div>
					<div>
						<UBadge color="neutral" variant="outline">Nazwa NetWorkS!</UBadge>
						<p class="text-md break-words" :title="station.btsDetails?.networks?.networks_name">
							{{ station.btsDetails?.networks?.networks_name ?? "Brak" }}
						</p>
					</div>
				</div>
				<USeparator class="mt-3 mb-3" size="lg" />
				<h1 class="text-lg font-medium mb-2">Dodatkowe informacje</h1>
				<div class="grid grid-cols-2 gap-y-6 w-full">
					<div>
						<UBadge color="neutral" variant="outline">Miasto</UBadge>
						<p class="text-md">{{ capitalize(extraBTSDetails?.city as string) ?? "Brak danych" }}</p>
					</div>
					<div>
						<UBadge color="neutral" variant="outline">Ulica / Numer</UBadge>
						<p class="text-md">
							{{ capitalize(`${extraBTSDetails?.street ?? ""} ${extraBTSDetails?.street_number ?? ""}` as string) ?? "Brak danych" }}
						</p>
					</div>
					<div>
						<UBadge color="neutral" variant="outline">Powiat</UBadge>
						<p class="text-md">{{ capitalize(extraBTSDetails?.district as string) ?? "Brak danych" }}</p>
					</div>
					<div>
						<UBadge color="neutral" variant="outline">Województwo</UBadge>
						<p class="text-md">{{ capitalize(extraBTSDetails?.province as string) ?? "Brak danych" }}</p>
					</div>
					<div>
						<UBadge color="neutral" variant="outline">Nr clustera</UBadge>
						<p class="text-md">{{ extraBTSDetails?.cluster ?? "Brak danych" }}</p>
					</div>
				</div>
				<USeparator class="mt-3 mb-3" size="lg" />
				<h1 class="text-lg font-medium mb-2">Nawigacja</h1>
				<div class="flex flex-row">
					<a
						:href="`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`"
						target="_blank"
						type="button"
						class="text-white bg-[#4285F4] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-xs px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#4285F4]/55 me-2 mb-2"
					>
						<UIcon name="carbon:logo-google" class="size-6" />
						Otwórz w mapach Google
					</a>
					<a
						:href="`https://maps.apple.com/?q=${lat},${lng}`"
						target="_blank"
						type="button"
						class="text-white bg-[#050708] hover:bg-[#050708]/90 focus:ring-4 focus:outline-none focus:ring-[#050708]/50 font-medium rounded-lg text-xs px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#050708]/50 dark:hover:bg-[#050708]/30 me-2 mb-2"
					>
						<UIcon name="raphael:apple" class="size-6" />
						Otwórz w mapach Apple
					</a>
				</div>
				<USeparator class="mt-3 mb-3" size="lg" />
				<h1 class="text-lg font-medium mb-2">Notatki</h1>
				<SlideoverComments :key="station.bts_id" :bts_id="station.bts_id" :comments="btsNotes" />
			</div>
		</template>
	</USlideover>
</template>
<script setup lang="ts">
import type { BTSStationNotes, ExtraBTSStation, BTSStationSpecificDetails } from "@/interfaces/bts.js";

const extraBTSDetails = ref();
const btsNotes = ref<BTSStationNotes[]>([]);
const props = defineProps<{
	lat: number;
	lng: number;
	station: {
		owner: number;
		bts_id: number;
		type: string;
		location_type: string;
		btsDetails: BTSStationSpecificDetails | null;
	};
}>();
const cookie = useCookie("token");

const getExtraBTSDetails = async (bts_id: number): Promise<ExtraBTSStation | null> => {
	const { data, error } = await useCustomFetch<{ success: boolean; data?: ExtraBTSStation; error?: string }>(`/bts/${bts_id.toString()}/details`, {
		headers: cookie.value ? { Authorization: `Bearer ${cookie.value}` } : undefined,
	});
	if (!data?.value?.success || error?.value?.data || !data?.value?.data) return null;
	return data?.value?.data;
};

const getBTSNotes = async (bts_id: number): Promise<BTSStationNotes[]> => {
	const { data, error } = await useCustomFetch<{ success: boolean; data?: BTSStationNotes[]; error?: string }>(`/bts/${bts_id.toString()}/notes`, {
		headers: cookie.value ? { Authorization: `Bearer ${cookie.value}` } : undefined,
	});
	if (!data?.value?.success || error?.value?.data || !data?.value?.data) return [];

	return data?.value?.data;
};

extraBTSDetails.value = await getExtraBTSDetails(props.station.bts_id);
btsNotes.value = await getBTSNotes(props.station.bts_id);

watch(props, async () => {
	extraBTSDetails.value = await getExtraBTSDetails(props.station.bts_id);
	btsNotes.value = await getBTSNotes(props.station.bts_id);
});
</script>
