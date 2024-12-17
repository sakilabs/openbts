<template>
  <div class="z-[9999] absolute min-w-full w-1/2 bottom-0 mb-3 flex justify-center items-center">
    <div
      class="overflow-hidden rounded-full text-left focus:outline-none sm:text-sm border border-gray-300 dark:border-gray-600 dark:text-white bg-white dark:bg-[#0f172a] p-2 flex justify-center items-center"
    >
      <div class="font-medium flex items-center truncate select-none">
        <UIcon name="heroicons:bars-3" class="mr-1"></UIcon>
        <div class="flex items-center flex-grow">
          <input
            v-if="isEditing && canEdit"
            v-model="editableText"
            ref="inputRef"
            @keyup.enter="saveChanges"
            class="bg-transparent border-none focus:outline-none px-1"
            :class="{ 'dark:text-white': true }"
          />
          <span v-else>{{ text }}</span>
        </div>
        <button
          class="flex ml-1 cursor-pointer"
          @click="toggleEdit"
          v-if="canEdit"
        >
          <UIcon
            :name="isEditing ? 'heroicons:check-circle' : 'heroicons:pencil-square-16-solid'"
          ></UIcon>
        </button>
        <span class="mx-1">•</span>
        <p>Lista posiada {{ actualList?.stations.length ?? 0 }} stacji</p>
        <span class="mx-1">•</span>
        <button @click="copyLink" class="cursor-pointer flex justify-content items-center font-medium text-blue-600 dark:text-blue-500 hover:underline">Skopiuj link do listy <UIcon name="flowbite:arrow-up-right-from-square-outline" /></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { toast } from "vue-sonner";

import type { userListRequest } from "@/interfaces/requests.js";

const props = defineProps<{
	list: userListRequest | null;
}>();

if (!props?.list) throw new Error("List is required");

const lists = userLists();
const actualList = ref<userListRequest>(props.list);
const text = ref(props.list.name);
const editableText = ref(props.list.name);
const isEditing = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const cookie = useCookie("token");
const loggedUser = loggedInUser();

const canEdit = computed(() => {
	if (!loggedUser?.value?.user_id || !props.list?.created_by) return false;
	return loggedUser.value.user_id === props.list.created_by;
});

const toggleEdit = async () => {
	if (isEditing.value) {
		await saveChanges();
	} else {
		isEditing.value = true;
		editableText.value = text.value;
		nextTick(() => {
			inputRef.value?.focus();
		});
	}
};

const saveChanges = async () => {
	if (editableText.value.length > 50 || editableText.value.length < 3) {
		toast.error("Nazwa listy nie może być dłuższa niż 50 znaków ani krótsza niż 3 znaki");
		isEditing.value = false;
		return;
	}

	if (editableText.value.trim() && editableText.value !== text.value) {
		text.value = editableText.value;
		if (props?.list?.list_uuid) {
			const res = await patchList(props.list.list_uuid, text.value);
			if (res) toast.success("Zaktualizowano nazwę listy");
			else toast.error("Wystąpił błąd podczas aktualizacji nazwy listy");
		}
	}
	isEditing.value = false;
};

const patchList = async (list_uuid: string, name: string): Promise<userListRequest | null> => {
	const payload = {
		name,
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

const copyLink = () => {
	if (!props?.list?.list_uuid) return;
	const url = `${window.location.origin}/lists/${props.list.list_uuid}`;
	navigator.clipboard.writeText(url);
	toast.success("Skopiowano link do listy");
};

watch(
	() => lists,
	() => {
		const list = lists.value.find((l) => l.list_uuid === props?.list?.list_uuid);
		if (list) actualList.value = list;
	},
	{ deep: true },
);
</script>