import { API_BASE, fetchApiData, fetchJson } from "@/lib/api";
import type { Station, UkePermit } from "@/types/station";

export const fetchStation = (id: number) => fetchApiData<Station>(`stations/${id}`);
export const fetchUkePermit = (id: string) => fetchApiData<UkePermit[]>(`uke/permits?station_id=${id}`);

export type StationPhoto = {
  id: number; // locationPhotos.id
  attachment_uuid: string;
  mime_type: string;
  is_main: boolean;
  note: string | null;
  taken_at: string | null;
  createdAt: string;
  author: { uuid: string; username: string; name: string } | null;
};

export type LocationPhoto = {
  id: number;
  attachment_uuid: string;
  mime_type: string;
  note: string | null;
  taken_at: string | null;
  createdAt: string;
  author: { uuid: string; username: string; name: string } | null;
};

export const fetchStationPhotos = (stationId: number) => fetchApiData<StationPhoto[]>(`stations/${stationId}/photos`);

export const fetchLocationPhotos = (locationId: number) => fetchApiData<LocationPhoto[]>(`locations/${locationId}/photos`);

export async function setStationPhotoSelection(stationId: number, selected: number[], mainId: number | null): Promise<void> {
  await fetchJson(`${API_BASE}/stations/${stationId}/photos`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selected, main_id: mainId }),
  });
}

export async function uploadLocationPhotos(locationId: number, files: File[]): Promise<LocationPhoto[]> {
  const formData = new FormData();
  for (const file of files) formData.append("files", file);
  const res = await fetchJson<{ data: LocationPhoto[] }>(`${API_BASE}/locations/${locationId}/photos`, { method: "POST", body: formData });
  return res.data;
}

export async function updateLocationPhotoNote(locationId: number, photoId: number, note: string): Promise<void> {
  await fetchJson(`${API_BASE}/locations/${locationId}/photos/${photoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
}

export async function updateLocationPhotoTakenAt(locationId: number, photoId: number, takenAt: string | null): Promise<void> {
  await fetchJson(`${API_BASE}/locations/${locationId}/photos/${photoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taken_at: takenAt }),
  });
}

export async function deleteLocationPhoto(locationId: number, photoId: number): Promise<void> {
  await fetchJson(`${API_BASE}/locations/${locationId}/photos/${photoId}`, { method: "DELETE" });
}
