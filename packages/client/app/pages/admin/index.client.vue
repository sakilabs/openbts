<template>
  <div class="p-4" v-if="!error">
    <div class="flex flex-row">
      <h1 class="text-2xl font-bold mb-4">Admin Panel</h1>
      <UButton icon="i-heroicons-arrow-left" to="/" variant="ghost" class="mb-4 ml-2">Wróć do strony</UButton>
    </div>

    <div class="flex flex-col gap-y-4 lg:flex-row lg:gap-x-4">
      <UCard
        v-for="user in users"
        :key="user.user_id"
        class="cursor-pointer hover:shadow-lg transition-shadow lg:w-64 grow lg:grow-0"
        @click="$router.push(`/admin/user/${user.user_id}`)"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-medium">{{ user.display_name }}</h2>
            <UBadge :color="user.verified ? 'success' : 'error'">
              {{ user.verified ? 'Zweryfikowany' : 'Niezweryfikowany' }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-2">
          <p>Ilość list: {{ user.lists?.length || 0 }}</p>
          <p>Ilość komentarzy: {{ user.notes?.length || 0 }}</p>

          <UButton
            v-if="!user.verified"
            @click.stop="verifyUser(user.user_id)"
            color="success"
          >
            Zweryfikuj
          </UButton>
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

const { data, error } = await useCustomFetch<{
	data: { user_id: number; display_name: string; username: string; lists?: unknown[]; notes?: unknown[]; verified: boolean }[];
}>("/admin/users", {
	headers: {
		Authorization: `Bearer ${useCookie("token").value}`,
	},
});

if (error.value) {
	if (error.value.statusCode === 403) navigateTo("/");
}

const users = ref(data.value?.data || []);

async function verifyUser(userId: number) {
	const { data } = await useCustomFetch<{ success: boolean }>(`/admin/users/${userId}/verify`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${useCookie("token").value}`,
		},
	});

	if (data.value?.success) {
		const user = users.value.find((u: { user_id: number }) => u.user_id === userId);
		if (user) user.verified = true;
		toast.success("Użytkownik został zweryfikowany");
	} else toast.error("Wystąpił błąd podczas weryfikacji użytkownika");
}
</script>