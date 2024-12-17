<template>
	<UDropdownMenu v-if="!isListAuthor" @update:open="refreshLists" :items="computedItems" class="w-48">
		<button class="ml-1" v-if="bts_id"><UIcon :name="icon"></UIcon></button>
		<UButton
			v-else
			class="border-none py-2 text-sm leading-5 text-gray-900 focus:outline-none dark:text-white bg-white dark:bg-[#0f172a]"
			color="neutral"
			variant="outline"
			:label="!$device.isMobile ? 'Twoje listy' : undefined"
			:icon="icon"
		></UButton>
	</UDropdownMenu>
	<button v-else class="ml-1" @click="handleDirectAction">
		<UIcon :name="isInList ? 'heroicons:minus-circle-16-solid' : 'heroicons:plus-circle-16-solid'" />
	</button>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

import ConfirmDeletion from "./confirmDeletion.vue";
import { currentUserList } from "@/composables/userLists.js";

import type { DropdownMenuItem } from "@nuxt/ui/runtime/components/DropdownMenu.vue";
import type { userListRequest } from "@/interfaces/requests.js";

const props = defineProps<{
	bts_id?: number;
	icon: "heroicons:plus-circle-16-solid" | "heroicons:bars-3";
}>();

const cookie = useCookie("token");
const lists = userLists();
const currentUserListObj = currentUserList();
const list = currentUserListObj.value;
const sortLists = (a: userListRequest, b: userListRequest) => {
	const nameA = a.name.toLowerCase();
	const nameB = b.name.toLowerCase();

	if (nameA === nameB) return a.list_uuid.localeCompare(b.list_uuid);
	return nameA.localeCompare(nameB);
};

const isListAuthor = computed(() => {
	if (!list || !cookie.value) return false;
	const tokenData = decodeJwt(cookie.value);
	return tokenData.user_id === list.created_by;
});

const isInList = computed(() => {
	if (!list || !props.bts_id) return false;
	const isStationInList = list.stations.includes(props.bts_id);
	return isStationInList;
});

const handleStationAction = async (targetList: { list_uuid: string; name: string }, action: "add" | "remove") => {
	if (!props.bts_id) return;
	const isCurrentList = router.currentRoute.value.params?.id === targetList.list_uuid;
	const res = await patchList(targetList.list_uuid, props.bts_id, action);
	if (!res) return;
	await refreshLists();

	if (list && targetList.list_uuid === list.list_uuid) {
		if (action === "add" && !list.stations?.includes(props.bts_id)) list.stations = [...(list.stations || []), props.bts_id];
		else if (action === "remove" && list.stations?.includes(props.bts_id)) list.stations = list.stations.filter((id) => id !== props.bts_id);
	}

	toast.success(`Stacja '${props.bts_id}' została ${action === "add" ? "dodana do" : "usunięta z"} listy '${targetList.name}'`);
	const map = isCurrentList ? leafletListMap() : leafletMap();
	const marker = findMarker(map, { bts_id: props.bts_id });
	if (!marker) return;
	if (action === "remove") {
		marker.on("popupclose", () => {
			marker.remove();
		});
	} else marker.off("popupclose");
};

const handleDirectAction = async () => {
	if (!list || !props.bts_id) return;
	await handleStationAction(list, !isInList.value ? "add" : "remove");
};

const addOrRemoveStation = async (targetList: { list_uuid: string; name: string }, checked: boolean) => {
	await handleStationAction(targetList, checked ? "add" : "remove");
};

const computedItems = computed(() => {
	const baseItems: DropdownMenuItem[][] = [
		[
			{
				label: "Stwórz nową listę",
				icon: "i-heroicons-plus-circle-16-solid",
				async onSelect(e: Event) {
					e.preventDefault();
					const res = await createNewList(props?.bts_id);
					if (!res) return;
					await refreshLists();
					router.push(`/lists/${res.list_uuid}`);
				},
			},
		],
	];

	if (lists.value.length) {
		const sortedLists = [...lists.value].sort(sortLists);
		const listItems: DropdownMenuItem[] = sortedLists.map((list) => ({
			label: `${list.name}`,
			icon: "i-heroicons-list-bullet-16-solid",
			type: "checkbox" as const,
			checked: Boolean(props?.bts_id && list.stations.includes(props?.bts_id)),
			async onSelect(e: Event) {
				e.preventDefault();
				if (!props?.bts_id) router.push(`/lists/${list.list_uuid}`);
			},
			async onUpdateChecked(checked: boolean) {
				addOrRemoveStation(list, checked);
			},
			children: !props?.bts_id
				? [
						[
							{
								label: `Lista posiada ${list.stations.length} stacji`,
								type: "label",
							},
						],
						[
							{
								label: "Otwórz listę",
								icon: "i-flowbite-arrow-up-right-from-square-outline",
								async onSelect(e: Event) {
									e.preventDefault();
									router.push(`/lists/${list.list_uuid}`);
								},
							},
							{
								label: "Usuń listę",
								icon: "i-heroicons-trash-16-solid",
								async onSelect(e: Event) {
									e.preventDefault();
									const modal = useModal();
									modal.open(ConfirmDeletion, {
										name: list.name,
										list_uuid: list.list_uuid,
									});
								},
							},
						],
					]
				: undefined,
		}));
		baseItems.push(listItems);
	}

	return baseItems;
});
const router = useRouter();

document.body.addEventListener("confirmDeletion", async (e: Event) => {
	const event = e as CustomEvent<string>;
	const msg = await deleteList(event.detail);
	if (msg) toast.success(msg);
	else toast.error("Nie udało się usunąć listy");
	await refreshLists();
	router.currentRoute.value.params?.id === event.detail && msg && router.push("/");
});

const getUserLists = async (): Promise<userListRequest[]> => {
	const { data, error } = await useCustomFetch<{
		success: boolean;
		data?: userListRequest[];
		error?: string;
	}>("/lists/@me", {
		headers: cookie.value ? { Authorization: `Bearer ${cookie.value}` } : undefined,
		method: "GET",
	});
	if (!data?.value?.success || error?.value?.data) return [];

	return data?.value.data as userListRequest[];
};

const createNewList = async (bts_id?: number): Promise<userListRequest | null> => {
	const stations = bts_id ? [bts_id] : [];
	const { data, error } = await useCustomFetch<{
		success: boolean;
		data?: userListRequest;
		error?: string;
	}>("/lists/new", {
		headers: cookie.value ? { Authorization: `Bearer ${cookie.value}` } : undefined,
		method: "POST",
		body: JSON.stringify({
			stations,
		}),
	});
	if (!data?.value?.success || error?.value?.data) return null;

	return data?.value.data as userListRequest;
};

const patchList = async (list_uuid: string, bts_id: number, action: "add" | "remove"): Promise<userListRequest | null> => {
	const payload = {
		stations: {
			toAdd: action === "add" ? [bts_id] : [],
			toRemove: action === "remove" ? [bts_id] : [],
		},
	};
	const { data, error } = await useCustomFetch<{
		success: boolean;
		data?: userListRequest;
		error?: string;
	}>(`/lists/${list_uuid}`, {
		headers: cookie.value ? { Authorization: `Bearer ${cookie.value}` } : undefined,
		method: "PATCH",
		body: JSON.stringify(payload),
	});
	if (!data?.value?.success || error?.value?.data) return null;

	return data?.value.data as userListRequest;
};

const deleteList = async (list_uuid: string): Promise<string | null> => {
	const { data, error } = await useCustomFetch<{
		success: boolean;
		data?: string;
		error?: string;
	}>(`/lists/${list_uuid}`, {
		headers: cookie.value ? { Authorization: `Bearer ${cookie.value}` } : undefined,
		method: "DELETE",
	});
	if (!data?.value?.success || error?.value?.data) return null;

	return data?.value.data as string;
};

const refreshLists = async (bool = true) => {
	if (!bool) return;
	lists.value = await getUserLists();
};

const decodeJwt = (token: string) => {
	try {
		const base64Url = token.split(".")[1];
		if (!base64Url) return {};
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = atob(base64)
			.split("")
			.map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
			.join("");
		return JSON.parse(decodeURIComponent(jsonPayload));
	} catch (e) {
		console.error("Failed to decode JWT:", e);
		return {};
	}
};
</script>
