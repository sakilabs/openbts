import { toast } from "sonner";

export const API_BASE = import.meta.env.VITE_API_URL || "https://openbts.sakilabs.com/api/v1";
export const APP_NAME = import.meta.env.VITE_APP_NAME || "OpenBTS";

type ApiError = { code: string; message: string };

export class ApiResponseError extends Error {
	errors: ApiError[];
	status: number;

	constructor(status: number, errors: ApiError[]) {
		super(errors[0]?.message || `Request failed: ${status}`);
		this.status = status;
		this.errors = errors;
	}
}

export class BackendUnavailableError extends Error {
	status: number;

	constructor(status: number) {
		super(`Backend unavailable (HTTP ${status})`);
		this.status = status;
	}
}

type FetchOptions = RequestInit & {
	allowedErrors?: number[];
};

export async function fetchJson<T>(url: string, options?: FetchOptions): Promise<T> {
	const { allowedErrors, ...fetchOptions } = options ?? {};

	const response = await fetch(url, fetchOptions);

	if (!response.ok) {
		if (allowedErrors?.includes(response.status)) return null as T;

		if (response.status === 500 || response.status === 502)
			throw new BackendUnavailableError(response.status);

		try {
			const errorData = await response.json();
			if (errorData.errors?.length) throw new ApiResponseError(response.status, errorData.errors);
		} catch (e) {
			if (e instanceof ApiResponseError) throw e;
		}

		throw new Error(`Request failed: ${response.status}`);
	}

	if (response.status === 204) return undefined as T;
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

export function showApiError(error: unknown) {
	if (error instanceof ApiResponseError) {
		for (const err of error.errors) {
			toast.error(err.message || err.code);
		}
	} else if (error instanceof Error) {
		toast.error(error.message);
	} else {
		toast.error("An unexpected error occurred");
	}
}
