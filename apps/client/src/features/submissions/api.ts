import { fetchApiData, postApiData, fetchJson, API_BASE } from "@/lib/api";
import type { Location, CellDetails, LocationWithStations, Station, Region, Operator, UkeLocationWithPermits } from "@/types/station";
import type { SubmissionFormData, CellFormDetails, RatType } from "./types";
import type { SubmissionDetail, SubmissionRow } from "@/features/admin/submissions/types";

export { fetchOperators, fetchBands, fetchRegions } from "@/features/shared/api";

export type MySubmissionsResponse = { data: SubmissionRow[]; totalCount: number };

export async function fetchMySubmissions(limit = 20, offset = 0): Promise<MySubmissionsResponse> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return fetchJson<MySubmissionsResponse>(`${API_BASE}/submissions?${params.toString()}`);
}

export type SearchCell = {
  id: number;
  rat: string;
  station_id: number;
  band_id: number;
  notes: string | null;
  is_confirmed: boolean;
  updatedAt: string;
  createdAt: string;
  details: CellDetails;
};

export type SearchStation = {
  id: number;
  station_id: string;
  location_id: number;
  operator_id: number;
  notes: string | null;
  updatedAt: string;
  createdAt: string;
  is_confirmed: boolean;
  cells: SearchCell[];
  location: (Location & { region: Region }) | null;
  operator: Operator | null;
  extra_identificators?: { networks_id: number | null; networks_name: string | null; mno_name: string | null } | null;
};

export async function searchStations(query: string): Promise<SearchStation[]> {
  if (!query || query.length < 2) return [];
  return postApiData<SearchStation[], { query: string }>("search", { query });
}

export type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

export async function reverseGeocode(lat: number, lon: number): Promise<NominatimResult | null> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
    if (!response.ok) return null;

    return response.json();
  } catch {
    return null;
  }
}

export async function fetchLocationsInViewport(bounds: string, options?: { orphaned?: boolean }): Promise<LocationWithStations[]> {
  const params = `bounds=${encodeURIComponent(bounds)}&limit=500${options?.orphaned ? "&orphaned=true" : ""}`;
  return fetchApiData<LocationWithStations[]>(`locations?${params}`);
}

export async function fetchUkeLocationsInViewport(bounds: string): Promise<UkeLocationWithPermits[]> {
  return fetchApiData<UkeLocationWithPermits[]>(`uke/locations?bounds=${encodeURIComponent(bounds)}&limit=500`);
}

export type SubmissionResponse = {
  id: string;
  station_id: number | null;
  submitter_id: string;
  status: "pending" | "approved" | "rejected";
  type: "new" | "update" | "delete";
  pending_photos: number | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchStationForSubmission(id: number): Promise<SearchStation> {
  const station = await fetchApiData<Station>(`stations/${id}`);
  return {
    id: station.id,
    station_id: station.station_id,
    location_id: station.location_id,
    operator_id: station.operator?.id ?? null,
    notes: station.notes,
    updatedAt: station.updatedAt,
    createdAt: station.createdAt,
    is_confirmed: station.is_confirmed,
    cells: station.cells.map((cell) => ({
      id: cell.id,
      rat: cell.rat,
      station_id: cell.station_id,
      band_id: cell.band.id,
      notes: cell.notes,
      is_confirmed: cell.is_confirmed,
      updatedAt: cell.updatedAt,
      createdAt: cell.createdAt,
      details: cell.details,
    })),
    location: station.location,
    operator: station.operator,
    extra_identificators: station.extra_identificators
      ? {
          networks_id: station.extra_identificators.networks_id,
          networks_name: station.extra_identificators.networks_name,
          mno_name: station.extra_identificators.mno_name,
        }
      : null,
  };
}

const ALLOWED_DETAIL_KEYS: Record<string, string[]> = {
  GSM: ["lac", "cid", "e_gsm"],
  UMTS: ["lac", "arfcn", "rnc", "cid"],
  LTE: ["tac", "enbid", "clid", "pci", "supports_iot"],
  NR: ["type", "nrtac", "gnbid", "clid", "pci", "supports_nr_redcap"],
};

const BOOLEAN_DETAIL_KEYS = new Set(["e_gsm", "supports_iot", "supports_nr_redcap"]);

export function pickCellDetails(rat: RatType | undefined, details: Partial<CellFormDetails> | undefined): Partial<CellFormDetails> | undefined {
  if (!details) return undefined;
  const allowedKeys = rat ? ALLOWED_DETAIL_KEYS[rat] : undefined;
  if (!allowedKeys) return details;

  const picked: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (key in details) picked[key] = (details as Record<string, unknown>)[key];
    else if (key === "type" && rat === "NR") picked[key] = "nsa";
    else picked[key] = BOOLEAN_DETAIL_KEYS.has(key) ? false : null;
  }

  return picked as Partial<CellFormDetails>;
}

function buildSubmissionPayload(data: SubmissionFormData): Record<string, unknown> {
  const payload: Record<string, unknown> = { type: data.type };

  if (data.station_id) payload.station_id = data.station_id;
  if (data.submitter_note) payload.submitter_note = data.submitter_note;
  if (data.station) {
    const { networks_id, networks_name, mno_name, ...stationBase } = data.station;
    const hasAnyExtraIdField = "networks_id" in data.station || "networks_name" in data.station || "mno_name" in data.station;
    payload.station = {
      ...stationBase,
      ...(hasAnyExtraIdField ? { networks_id: networks_id ?? null, networks_name: networks_name ?? null, mno_name: mno_name ?? null } : {}),
    };
  }
  if (data.location) payload.location = data.location;
  if (data.cells.length > 0) {
    payload.cells = data.cells.map((cell) => ({
      operation: cell.operation,
      target_cell_id: cell.target_cell_id,
      band_id: cell.band_id,
      rat: cell.rat,
      notes: cell.notes,
      details: pickCellDetails(cell.rat, cell.details),
    }));
  }
  if (data.pending_photos) payload.pending_photos = data.pending_photos;
  if (data.location_photo_ids?.length) payload.location_photo_ids = data.location_photo_ids;

  return payload;
}

export async function createSubmission(data: SubmissionFormData): Promise<SubmissionResponse> {
  const results = await postApiData<SubmissionResponse[]>("submissions", buildSubmissionPayload(data));
  return results[0];
}

export async function updateSubmission(id: string, data: SubmissionFormData): Promise<SubmissionResponse> {
  return fetchApiData<SubmissionResponse>(`submissions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildSubmissionPayload(data)),
  });
}

export async function deleteSubmission(id: string): Promise<void> {
  await fetchJson(`${API_BASE}/submissions/${id}`, { method: "DELETE" });
}

export async function fetchSubmissionForEdit(id: string) {
  return fetchApiData<SubmissionDetail>(`submissions/${id}`);
}

export type SubmissionPhoto = {
  id: number;
  attachment_uuid: string;
  mime_type: string;
  note: string | null;
  taken_at: string | null;
  createdAt: string;
  author: { uuid: string; username: string; name: string } | null;
};

export async function fetchSubmissionPhotos(submissionId: string): Promise<SubmissionPhoto[]> {
  return fetchApiData<SubmissionPhoto[]>(`submissions/${submissionId}/photos`);
}

export async function deleteSubmissionPhoto(submissionId: string, photoId: number): Promise<void> {
  await fetchJson(`${API_BASE}/submissions/${submissionId}/photos/${photoId}`, { method: "DELETE" });
}

export async function updateSubmissionPhotoNote(submissionId: string, photoId: number, note: string): Promise<void> {
  await fetchJson(`${API_BASE}/submissions/${submissionId}/photos/${photoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
}

export async function updateSubmissionPhotoTakenAt(submissionId: string, photoId: number, takenAt: string | null): Promise<void> {
  await fetchJson(`${API_BASE}/submissions/${submissionId}/photos/${photoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taken_at: takenAt }),
  });
}

export async function uploadSubmissionPhotos(submissionId: string, files: File[], notes?: string[], takenAts?: (string | null)[]): Promise<void> {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("notes", notes?.[i] ?? "");
    formData.append("takenAts", takenAts?.[i] ?? "");
    formData.append("files", files[i]);
  }
  await fetchJson(`${API_BASE}/submissions/${submissionId}/photos`, {
    method: "POST",
    body: formData,
  });
}
