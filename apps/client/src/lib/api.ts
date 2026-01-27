export const API_BASE = import.meta.env.VITE_API_URL || "https://openbts.sakilabs.com/api/v1";

type FetchOptions = RequestInit & {
	allowedErrors?: number[];
};

export async function fetchJson<T>(url: string, options?: FetchOptions): Promise<T> {
	const { allowedErrors, ...fetchOptions } = options ?? {};

	const response = await fetch(url, fetchOptions);

	if (!response.ok) {
		if (allowedErrors?.includes(response.status)) {
			return null as T;
		}
		throw new Error(`Request failed: ${response.status}`);
	}

	return response.json();
}

export async function fetchApiData<T>(endpoint: string, options?: FetchOptions): Promise<T> {
	const result = await fetchJson<{ data: T }>(`${API_BASE}/${endpoint}`, options);
	return result?.data ?? (null as T);
}

export async function postApiData<T, B = unknown>(endpoint: string, body: B): Promise<T> {
	const result = await fetchJson<{ data: T }>(`${API_BASE}/${endpoint}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	return result.data;
}
