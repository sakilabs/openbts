import { fetchJson, API_BASE } from "@/lib/api";

export interface RuntimeSettings {
  enforceAuthForAllRoutes: boolean;
  allowedUnauthenticatedRoutes: string[];
  disabledRoutes: string[];
  enableStationComments: boolean;
  submissionsEnabled: boolean;
}

export type SettingsPatch = Partial<RuntimeSettings>;

export async function fetchSettings(): Promise<RuntimeSettings> {
  const res = await fetchJson<{ data: RuntimeSettings }>(`${API_BASE}/settings`);
  return res.data;
}

export async function patchSettings(patch: SettingsPatch): Promise<RuntimeSettings> {
  const res = await fetchJson<{ data: RuntimeSettings }>(`${API_BASE}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.data;
}

export async function cleanupSubmissions(): Promise<{ cleaned: number }> {
  const res = await fetchJson<{ data: { cleaned: number } }>(`${API_BASE}/submissions/cleanup`, {
    method: "POST",
  });
  return res.data;
}
