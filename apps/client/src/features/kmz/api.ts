import { API_BASE, fetchJson } from "@/lib/api";

export const KMZ_TYPES = ["stations", "radiolines"] as const;
export const KMZ_SOURCES = ["all", "permits", "device_registry"] as const;

export type KmzType = (typeof KMZ_TYPES)[number];
export type KmzSource = (typeof KMZ_SOURCES)[number];

export interface KmzFile {
  date: string;
  type: KmzType;
  source: KmzSource;
  region: string | null;
  filename: string;
  size: number;
}

interface KmzListResponse {
  data: KmzFile[];
  totalCount: number;
}

export function fetchKmzList(type: KmzType, source: KmzSource): Promise<KmzListResponse> {
  const params = new URLSearchParams({ type, source, limit: "50" });
  return fetchJson<KmzListResponse>(`${API_BASE}/kmz?${params.toString()}`);
}

export async function downloadKmzFile(file: KmzFile): Promise<boolean> {
  const { date, type, source, region } = file;
  const params = new URLSearchParams({ date, type, source });
  if (region) params.set("region", region);

  try {
    const response = await fetch(`${API_BASE}/kmz/download?${params.toString()}`);
    if (!response.ok) return false;

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    return true;
  } catch {
    return false;
  }
}
