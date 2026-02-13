import type { Station, UkePermit } from "@/types/station";
import { fetchApiData } from "@/lib/api";

export const fetchStation = (id: number) => fetchApiData<Station>(`stations/${id}`);
export const fetchUkePermit = (id: string) => fetchApiData<UkePermit[]>(`uke/permits?station_id=${id}`);
