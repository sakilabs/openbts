import type { Station, UkePermit } from "@/types/station";
import { fetchApiData, fetchJson, API_BASE } from "@/lib/api";

export const fetchStation = (id: number) => fetchApiData<Station>(`stations/${id}`);
export const fetchUkePermit = (id: string) => fetchApiData<UkePermit[]>(`uke/permits?station_id=${id}`);

export type StationPhoto = {
  id: number;
  attachment_uuid: string;
  mime_type: string;
  is_main: boolean;
  note: string | null;
  createdAt: string;
  author: { uuid: string; username: string; name: string } | null;
};

export const fetchStationPhotos = (stationId: number) => fetchApiData<StationPhoto[]>(`stations/${stationId}/photos`);

export async function setMainPhoto(stationId: number, photoId: number): Promise<void> {
  await fetchJson(`${API_BASE}/stations/${stationId}/photos/${photoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_main: true }),
  });
}

export async function updatePhotoNote(stationId: number, photoId: number, note: string): Promise<void> {
  await fetchJson(`${API_BASE}/stations/${stationId}/photos/${photoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
}

export async function deleteStationPhoto(stationId: number, photoId: number): Promise<void> {
  await fetchJson(`${API_BASE}/stations/${stationId}/photos/${photoId}`, { method: "DELETE" });
}

export async function uploadStationPhotos(stationId: number, files: File[]): Promise<StationPhoto[]> {
  const formData = new FormData();
  for (const file of files) formData.append("files", file);
  const res = await fetchJson<{ data: StationPhoto[] }>(`${API_BASE}/stations/${stationId}/photos`, { method: "POST", body: formData });
  return res.data;
}
