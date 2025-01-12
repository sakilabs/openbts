import type { UseFetchOptions } from "#app";

function useCustomFetch<T>(url: string | (() => string), options: UseFetchOptions<{ success: boolean; data?: T; error?: string }> = {}) {
	const runtimeConfig = useRuntimeConfig();
	return useFetch<{ success: boolean; data?: T; error?: string }>(url, {
		baseURL: runtimeConfig.public.BASE_API_URL,
		deep: false,
		...options,
	});
}

const cookie = useCookie("token");
export function execFetch<T>(url: string | (() => string), options: UseFetchOptions<{ success: boolean; data?: T; error?: string }> = {}) {
	const { data, error } = useCustomFetch<T>(url, {
		...options,
		headers: cookie.value ? { Authorization: `Bearer ${cookie.value}` } : undefined,
	});

	if (!data?.value?.success || error?.value?.data || !data?.value?.data) return null;
	return data?.value.data;
}
