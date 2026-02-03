import { fetchApiData, postApiData } from "@/lib/api";
import type { Band, Operator, Region, Location, CellDetails } from "@/types/station";
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

export type SubmissionResponse = {
	id: number;
	station_id: number | null;
	submitter_id: string;
	status: "pending" | "approved" | "rejected";
	type: "new" | "update";
	createdAt: string;
	updatedAt: string;
};

export async function createSubmission(data: SubmissionFormData): Promise<SubmissionResponse> {
	const payload: Record<string, unknown> = {
		type: data.type,
	};

	if (data.station_id) payload.station_id = data.station_id;
	if (data.proposedStation) payload.proposedStation = data.proposedStation;
	if (data.proposedLocation) payload.proposedLocation = data.proposedLocation;
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
