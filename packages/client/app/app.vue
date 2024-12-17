<template>
	<VitePwaManifest />
	<NuxtLoadingIndicator />
	<Toaster richColors position="top-right" />
	<UApp>
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</UApp>
</template>

<script setup lang="ts">
import "@/assets/css/tailwindui.css";
import "@/assets/css/main.css";

const cookie = useCookie("token");
const colorMode = useColorMode();
const getMeInfo = async (): Promise<{ user_id: number; display_name: string; username: string; verified: boolean } | null> => {
	const { data, error } = await useCustomFetch<{
		success: boolean;
		data?: { user_id: number; display_name: string; username: string; verified: boolean };
		error?: string;
	}>("/@me", {
		headers: cookie.value ? { Authorization: `Bearer ${cookie.value}` } : undefined,
		method: "GET",
	});

	if (!data?.value?.success || error?.value?.data) return null;
	return data?.value.data as { user_id: number; display_name: string; username: string; verified: boolean };
};

const userInfo = await getMeInfo();
const loggedUser = loggedInUser();
loggedUser.value = userInfo;

onMounted(() => {
	const htmlSelector = document.querySelector("html");
	if (!htmlSelector) return;
	if (colorMode.value === "light") htmlSelector.setAttribute("data-theme", "light");
	else htmlSelector.setAttribute("data-theme", "dark");
});
</script>
