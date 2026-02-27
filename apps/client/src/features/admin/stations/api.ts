import { fetchJson, API_BASE } from "@/lib/api";
import type { Station, Cell } from "@/types/station";

export async function patchStation(stationId: number, body: Record<string, unknown>) {
  return fetchJson<{ data: Station }>(`${API_BASE}/stations/${stationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchCell(stationId: number, cellId: number, body: Record<string, unknown>) {
  return fetchJson<{ data: Cell }>(`${API_BASE}/stations/${stationId}/cells/${cellId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchCells(stationId: number, cellsData: Array<{ cell_id: number } & Record<string, unknown>>) {
  return fetchJson<{ data: Cell[] }>(`${API_BASE}/stations/${stationId}/cells`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cells: cellsData }),
  });
}

export async function createCells(stationId: number, cellsData: Record<string, unknown>[]) {
  return fetchJson<{ data: Cell[] }>(`${API_BASE}/stations/${stationId}/cells`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cells: cellsData }),
  });
}

export async function deleteCell(stationId: number, cellId: number) {
  return fetchJson<void>(`${API_BASE}/stations/${stationId}/cells/${cellId}`, {
    method: "DELETE",
  });
}

export async function createLocation(body: { region_id: number; city?: string; address?: string; longitude: number; latitude: number }) {
  return fetchJson<{ data: { id: number } }>(`${API_BASE}/locations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteStation(stationId: number) {
  return fetchJson<void>(`${API_BASE}/stations/${stationId}`, {
    method: "DELETE",
  });
}

export async function createStation(body: Record<string, unknown>) {
  return fetchJson<{ data: Station }>(`${API_BASE}/stations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function updateExtraIds(
  stationId: number,
  body: { networks_id?: number | null; networks_name?: string | null; mno_name?: string | null },
) {
  return fetchJson<{ data: { id: number; networks_id: number | null; networks_name: string | null; mno_name: string | null } }>(
    `${API_BASE}/stations/${stationId}/extra-identifiers`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}
