import { fetchApiData, postApiData, fetchJson, API_BASE } from "@/lib/api";
import type { Location, CellDetails, LocationWithStations, Station, Region, Operator, UkeLocationWithPermits } from "@/types/station";
import type { SubmissionFormData, CellFormDetails, RatType } from "./types";
import type { SubmissionDetail } from "@/features/admin/submissions/types";

export { fetchOperators, fetchBands, fetchRegions } from "@/features/shared/api";

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
  id: number;
  station_id: number | null;
  submitter_id: string;
  status: "pending" | "approved" | "rejected";
  type: "new" | "update" | "delete";
  createdAt: string;
  updatedAt: string;
};

export async function fetchStationForSubmission(id: number): Promise<SearchStation> {
  const station = await fetchApiData<Station>(`stations/${id}`);
  return {
    id: station.id,
    station_id: station.station_id,
    location_id: station.location_id,
    operator_id: station.operator_id,
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
  };
}

const ALLOWED_DETAIL_KEYS: Record<string, string[]> = {
  GSM: ["lac", "cid", "is_egsm"],
  UMTS: ["lac", "carrier", "rnc", "cid"],
  LTE: ["tac", "enbid", "clid", "pci", "supports_nb_iot"],
  NR: ["type", "nrtac", "gnbid", "clid", "pci", "supports_nr_redcap"],
};

const BOOLEAN_DETAIL_KEYS = new Set(["is_egsm", "supports_nb_iot", "supports_nr_redcap"]);

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

export async function createSubmission(data: SubmissionFormData): Promise<SubmissionResponse> {
  const payload: Record<string, unknown> = {
    type: data.type,
  };

  if (data.station_id) payload.station_id = data.station_id;
  if (data.submitter_note) payload.submitter_note = data.submitter_note;
  if (data.station) payload.station = data.station;
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

  return postApiData<SubmissionResponse>("submissions", payload);
}

export async function updateSubmission(id: string, data: SubmissionFormData): Promise<SubmissionResponse> {
  const payload: Record<string, unknown> = { type: data.type };
  if (data.station_id) payload.station_id = data.station_id;
  if (data.submitter_note) payload.submitter_note = data.submitter_note;
  if (data.station) payload.station = data.station;
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
  return fetchApiData<SubmissionResponse>(`submissions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteSubmission(id: string): Promise<void> {
  await fetchJson(`${API_BASE}/submissions/${id}`, { method: "DELETE" });
}

export async function fetchSubmissionForEdit(id: string) {
  return fetchApiData<SubmissionDetail>(`submissions/${id}`);
}
