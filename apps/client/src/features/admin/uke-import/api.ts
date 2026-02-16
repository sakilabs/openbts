import { fetchJson, API_BASE } from "@/lib/api";

export type ImportStepKey = "stations" | "radiolines" | "permits" | "prune_associations" | "associate" | "cleanup";
export type StepStatus = "pending" | "running" | "success" | "skipped" | "error";
export type JobState = "idle" | "running" | "success" | "error";

export interface ImportStep {
  key: ImportStepKey;
  status: StepStatus;
  startedAt?: string;
  finishedAt?: string;
}

export interface ImportJobStatus {
  state: JobState;
  startedAt?: string;
  finishedAt?: string;
  steps: ImportStep[];
  error?: string;
}

export interface StartImportPayload {
  importStations?: boolean;
  importRadiolines?: boolean;
  importPermits?: boolean;
}

export async function fetchImportStatus(): Promise<ImportJobStatus> {
  const res = await fetchJson<{ data: ImportJobStatus }>(`${API_BASE}/uke/import/status`);
  return res.data;
}

export async function startImport(payload: StartImportPayload): Promise<ImportJobStatus> {
  const res = await fetchJson<{ data: ImportJobStatus }>(`${API_BASE}/uke/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.data;
}
