<template>
	<div v-if="!tokenCookie">
		<UTabs :items="items">
			<template #login>
				<div class="flex flex-col items-center justify-center">
					<UForm :state="stateLogin" @submit="onSubmit" class="space-y-4">
						<UFormField label="Nazwa użytkownika" name="username" class="mt-2">
							<UInput v-model="stateLogin.username" placeholder="Wprowadź swoją nazwe użytkownika" required class="w-64" />
						</UFormField>
						<UFormField label="Hasło" name="password">
							<UInput v-model="stateLogin.password" placeholder="Wprowadź swoje hasło" type="password" required class="w-64" />
						</UFormField>
						<UButton type="submit" label="Zaloguj się" />
					</UForm>
				</div>
			</template>
			<template #register>
				<div class="flex flex-col items-center justify-center">
					<UForm :state="stateRegister" @submit="onSubmit" class="space-y-4">
						<UFormField label="Nazwa użytkownika" class="mt-2">
							<UInput v-model="stateRegister.username" placeholder="Wprowadź nazwe użytkownika" class="w-64" />
						</UFormField>
						<UFormField label="Wyświetlana nazwa">
							<UInput v-model="stateRegister.displayName" placeholder="Wprowadź display name" class="w-64" />
						</UFormField>
						<UFormField label="Hasło">
							<UInput v-model="stateRegister.password" placeholder="Wprowadź wybrane hasło" type="password" class="w-64" />
						</UFormField>
						<UButton type="submit" label="Zarejestruj się" />
					</UForm>
				</div>
			</template>
		</UTabs>
	</div>
</template>
<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui/runtime/types/form.js";

definePageMeta({
	layout: "auth",
});

const { $toast: toast } = useNuxtApp();
const router = useRouter();
const tokenCookie = useCookie("token", { expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365) });

if (tokenCookie.value) {
	toast.info("Już jesteś zalogowany");
	router.push("/");
}

const items = ref([
	{
		label: "Zaloguj się",
		icon: "i-heroicons-user",
		slot: "login",
	},
	{
		label: "Zarejestruj się",
		icon: "i-heroicons-lock-closed",
		slot: "register",
	},
]);
const stateLogin = reactive({
	type: "login",
	username: "",
	password: "",
});
const stateRegister = reactive({
	type: "register",
	username: "",
	displayName: "",
	password: "",
});

async function onSubmit(event: FormSubmitEvent<{ type: string; username: string; displayName?: string; password: string }>) {
	if (event.data.type === "login") {
		const loginRequest = async (state: { username: string; password: string }): Promise<{
			success: boolean;
			message?: string;
			token?: string;
		}> => {
			const { data, error } = await useCustomFetch<{ success: boolean; message?: string; token?: string }>("/login", {
				method: "POST",
				body: JSON.stringify({
					username: state.username,
					password: state.password,
				}),
			});
			if (!data?.value && !error?.value?.message) return { success: false };

			return (data?.value || error?.value?.data) as { success: boolean; message?: string; token?: string };
		};

		const loginResponse = await loginRequest({ username: event.data.username, password: event.data.password });
		if (!loginResponse.success) toast.error(loginResponse.message as string);
		else {
			toast.success(loginResponse.message as string);
			tokenCookie.value = loginResponse.token as string;
			router.push("/");
		}
	} else {
		const registerRequest = async (state: { username: string; displayName: string; password: string }): Promise<{
			success: boolean;
			message?: string;
			token?: string;
		}> => {
			const { data, error } = await useCustomFetch<{ success: boolean; message?: string; token?: string }>("/register", {
				method: "POST",
				body: JSON.stringify({
					username: state.username,
					displayName: state.displayName,
					password: state.password,
				}),
			});
			if (!data?.value && !error?.value?.message) return { success: false };
			return (data?.value || error?.value?.data) as { success: boolean; message?: string; token?: string };
		};

		const registerResponse = await registerRequest({
			username: event.data.username,
			displayName: event.data.displayName as string,
			password: event.data.password,
		});

		if (!registerResponse.success) toast.error(registerResponse.message as string);
		else toast.success(registerResponse.message as string);
	}
}
</script>
