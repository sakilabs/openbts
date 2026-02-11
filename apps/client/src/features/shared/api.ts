import { fetchApiData } from "@/lib/api";
import type { Band, Operator, Region } from "@/types/station";

export const fetchOperators = () => fetchApiData<Operator[]>("operators");

export const fetchBands = () => fetchApiData<Band[]>("bands");

export const fetchRegions = () => fetchApiData<Region[]>("regions");
