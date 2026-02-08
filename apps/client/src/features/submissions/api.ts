import { fetchApiData, postApiData } from "@/lib/api";
import type { Band, Operator, Region, Location, CellDetails, LocationWithStations, Station } from "@/types/station";
import type { SubmissionFormData } from "./types";

export const fetchOperators = () => fetchApiData<Operator[]>("operators");

export const fetchBands = () => fetchApiData<Band[]>("bands");

export const fetchRegions = () => fetchApiData<Region[]>("regions");

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

export async function fetchLocationsInViewport(bounds: string): Promise<LocationWithStations[]> {
	return fetchApiData<LocationWithStations[]>(`locations?bounds=${encodeURIComponent(bounds)}&limit=500`);
}

export type SubmissionResponse = {
	id: number;
	station_id: number | null;
	submitter_id: string;
	status: "pending" | "approved" | "rejected";
	type: "new" | "update";
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

export async function createSubmission(data: SubmissionFormData): Promise<SubmissionResponse> {
	const payload: Record<string, unknown> = {
		type: data.type,
	};

	if (data.station_id) payload.station_id = data.station_id;
	if (data.station) payload.station = data.station;
	if (data.location) payload.location = data.location;
	if (data.cells.length > 0) {
		payload.cells = data.cells.map((cell) => ({
			operation: cell.operation,
			target_cell_id: cell.target_cell_id,
			band_id: cell.band_id,
			rat: cell.rat,
			notes: cell.notes,
			details: cell.details,
		}));
	}

	return postApiData<SubmissionResponse>("submissions", payload);
}
