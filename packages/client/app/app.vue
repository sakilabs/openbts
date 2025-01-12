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
import { execFetch } from "@/composables/useCustomFetch.js";

const colorMode = useColorMode();
const getMeInfo = async (): Promise<{ user_id: number; display_name: string; username: string; verified: boolean } | null> => {
	const data = execFetch<{ user_id: number; display_name: string; username: string; verified: boolean } | null>("/@me", {
		method: "GET",
	});

	return data;
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
