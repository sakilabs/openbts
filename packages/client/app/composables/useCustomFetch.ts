import type { UseFetchOptions } from "#app";

export function useCustomFetch<T>(url: string | (() => string), options: UseFetchOptions<T> = {}) {
	const runtimeConfig = useRuntimeConfig();
	return useFetch(url, {
		baseURL: runtimeConfig.public.BASE_API_URL,
		deep: false,
		...options,
	});
}
