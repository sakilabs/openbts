<template>
	<div class="p-4" v-if="!error">
		<div class="mb-4">
			<UButton icon="i-heroicons-arrow-left" to="/admin" variant="ghost">Wróć do głównej panelu admina</UButton>
		</div>

		<div class="flex flex-row space-x-4">
			<UCard v-if="user" class="grow">
				<template #header>
					<div class="flex justify-between items-center">
						<h1 class="text-2xl font-bold">{{ user.display_name }}</h1>
						<UBadge :color="user.verified ? 'success' : 'error'">
							{{ user.verified ? "Zweryfikowany" : "Niezweryfikowany" }}
						</UBadge>
					</div>
				</template>

				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-semibold mb-2">Listy</h2>
						<div class="space-y-2">
							<UCard v-for="list in user.lists" :key="list.list_id" class="bg-gray-50 dark:bg-gray-800">
								<div class="flex justify-between items-center">
									<div>
										<h3 class="font-medium text-blue-500 link-underline"><NuxtLink :href="`/lists/${list.list_uuid}`">{{ list.name }} <UIcon name="flowbite:arrow-up-right-from-square-outline" /></NuxtLink></h3>
										<p class="text-sm text-gray-500">ID: {{ list.list_id }}</p>
										<p class="text-sm text-gray-500">Stacje: {{ list?.stations?.join(", ") ?? "Brak" }}</p>
									</div>
									<p class="text-sm text-gray-500">{{ $dayjs(list.created_at).format("LLLL") }}</p>
								</div>
							</UCard>
							<p v-if="!user.lists?.length" class="text-gray-500">Brak stworzonych list</p>
						</div>
					</div>

					<div>
						<h2 class="text-xl font-semibold mb-2">Notatki</h2>
						<div class="space-y-2">
							<UCard v-for="note in user.notes" :key="note.comment_id" class="bg-gray-50 dark:bg-gray-800">
								<div>
									<div class="flex justify-between items-center mb-2">
										<p class="text-sm text-gray-500">BTS ID: {{ note.bts_id }}</p>
										<p class="text-sm text-gray-500">{{ $dayjs(note.created_at).format("LLLL") }}</p>
									</div>
									<p>{{ note.comment }}</p>
									<div v-if="note.attachments?.length" class="mt-2">
										<p class="text-sm text-gray-500">Ilość załączników: {{ note.attachments.length }}</p>
									</div>
								</div>
							</UCard>
							<p v-if="!user.notes?.length" class="text-gray-500">Brak notatek od tego użytkownika</p>
						</div>
					</div>
				</div>
			</UCard>
		</div>
	</div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

definePageMeta({
	layout: "admin",
});

interface User {
	user_id: number;
	display_name: string;
	username: string;
	verified: boolean;
	lists?: {
		list_id: number;
		list_uuid: string;
		name: string;
		stations?: number[];
		created_at: string;
	}[];
	notes?: {
		comment_id: number;
		bts_id: number;
		comment: string;
		created_at: string;
		attachments?: unknown[];
	}[];
}

const route = useRoute();
const userId = route.params.id;

const { data, error } = await useCustomFetch<{ data: User }>(`/admin/users/${userId}`, {
	headers: {
		Authorization: `Bearer ${useCookie("token").value}`,
	},
});

if (error?.value?.statusCode === 403) navigateTo("/");

if (error.value?.data) {
	toast.error("Nie znaleziono użytkownika");
	navigateTo("/admin");
}

const user = ref(data.value?.data);
</script>
