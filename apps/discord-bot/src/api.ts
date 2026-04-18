const API_BASE = (process.env.API_BASE_URL ?? "http://localhost:3030").replace(/\/$/, "");

export type Band = { id: number; name: string; value: number | null; rat: string; duplex: string | null };
export type GsmDetails = { lac: number; cid: number; e_gsm: boolean | null };
export type UmtsDetails = { lac: number | null; rnc: number; cid: number; cid_long: number; arfcn: number | null };
export type LteDetails = {
  tac: number | null;
  enbid: number;
  clid: number;
  ecid: number;
  pci: number | null;
  earfcn: number | null;
  supports_iot: boolean | null;
};
export type NrDetails = {
  nrtac: number | null;
  gnbid: number | null;
  gnbid_length: number | null;
  clid: number | null;
  nci: string | null;
  pci: number | null;
  arfcn: number | null;
  type: string;
  supports_nr_redcap: boolean | null;
};
export type CellDetails = GsmDetails | UmtsDetails | LteDetails | NrDetails | null;

export type Cell = {
  id: number;
  rat: "GSM" | "UMTS" | "LTE" | "NR";
  notes: string | null;
  band: Band;
  details: CellDetails;
};

export type Operator = { id: number; name: string; full_name: string; mnc: number | null };
export type Region = { id: number; name: string };

export type Location = {
  id: number;
  city: string;
  address: string;
  longitude: number;
  latitude: number;
  region: Region;
};

export type ExtraIdentificator = {
  id: number;
  networks_id: number | null;
  networks_name: string | null;
  mno_name: string | null;
};

export type Station = {
  id: number;
  station_id: string;
  notes: string | null;
  extra_address: string | null;
  createdAt: string;
  updatedAt: string;
  cells: Cell[];
  location: Location;
  operator: Operator;
  extra_identificators?: ExtraIdentificator;
};

export type Photo = {
  id: number;
  attachment_uuid: string;
  mime_type: string;
  is_main: boolean;
  note: string | null;
  taken_at: string | null;
  createdAt: string;
  author: { uuid: string; username: string; name: string } | null;
};

export type StationSummary = Omit<Station, "location"> & {
  location: (Omit<Location, "region"> & { region: Region }) | null;
  operator: Operator | null;
};

export type LocationWithStations = {
  id: number;
  city: string;
  address: string;
  longitude: number;
  latitude: number;
  region: Region;
  stations: StationSummary[];
};

const API_KEY = process.env.API_KEY;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}/${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "X-Api-Key": API_KEY } : {}),
      ...Object.fromEntries(new Headers(init?.headers)),
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string; errors?: { message?: string }[] };
    throw new Error(body.message ?? body.errors?.[0]?.message ?? `API ${res.status} ${path}`);
  }
  const body = (await res.json()) as { data: T };
  return body.data;
}

export function getStation(id: number): Promise<Station> {
  return apiFetch<Station>(`/stations/${id}`);
}

export function getStationPhotos(stationId: number): Promise<Photo[]> {
  return apiFetch<Photo[]>(`/stations/${stationId}/photos`);
}

export function searchStations(query: string, limit = 25): Promise<StationSummary[]> {
  return apiFetch<StationSummary[]>(`/search?limit=${limit}`, {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

export function getLocation(id: number): Promise<LocationWithStations> {
  return apiFetch<LocationWithStations>(`/locations/${id}`);
}

export type PemReport = { url: string; date: string; year: number; source: string; number: string; intensity: number; feature_id: string };

export function getStationPem(station: Station): Promise<PemReport[]> {
  const { latitude, longitude } = station.location;
  const mnc = station.operator.mnc;
  if (mnc === null) return Promise.resolve([]);
  return apiFetch<PemReport[]>(`/pem/${station.station_id}?lat=${latitude}&lng=${longitude}&operator=${mnc}`);
}

function publicBase(): string {
  return (process.env.PUBLIC_BASE_URL ?? API_BASE).replace(/\/$/, "");
}

export function photoUrl(attachmentUuid: string): string {
  return `${publicBase()}/uploads/${attachmentUuid}.webp`;
}

export function stationUrl(station: Pick<Station, "id" | "location">): string {
  const { latitude, longitude } = station.location;
  return `${publicBase()}/#map=16.00/${latitude}/${longitude}~f~S${station.id}`;
}
