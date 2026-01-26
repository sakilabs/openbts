import { useQuery } from "@tanstack/react-query";
import { fetchApiData } from "@/lib/api";

export interface RuntimeSettings {
	enforceAuthForAllRoutes: boolean;
	allowedUnauthenticatedRoutes: string[];
	disabledRoutes: string[];
	enableStationComments: boolean;
}

const fetchSettings = () =>
	fetchApiData<RuntimeSettings>("settings", {
		allowedErrors: [403, 404],
	}).then((data) => data ?? null);

export function useSettings() {
	return useQuery({
		queryKey: ["settings"],
		queryFn: fetchSettings,
		staleTime: 1000 * 60 * 10,
		gcTime: 1000 * 60 * 30,
	});
}
