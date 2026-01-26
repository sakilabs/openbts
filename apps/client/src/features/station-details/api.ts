import type { Station } from "@/types/station";
import { fetchApiData } from "@/lib/api";

export const fetchStation = (id: number) => fetchApiData<Station>(`stations/${id}`);
