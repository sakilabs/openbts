export type Band = {
	id: number;
	value: number;
	rat: string;
	name: string;
	duplex: string | null;
};

export type Region = {
	id: number;
	name: string;
	code: string;
};

export type Location = {
	id: number;
	city: string;
	address: string;
	longitude: number;
	latitude: number;
	updatedAt: string;
	createdAt: string;
	region: Region;
};

export type Operator = {
	id: number;
	name: string;
	full_name: string;
	parent_id: number | null;
	mnc: number;
};

export type CellDetails = {
	// GSM
	lac?: number;
	cid?: number;
	e_gsm?: boolean;
	// UMTS
	rnc?: number;
	cid_long?: number;
	carrier?: number;
	// LTE
	tac?: number;
	enbid?: number;
	clid?: number;
	ecid?: number;
	supports_nb_iot?: boolean;
	// NR
	gnbid?: number;
	nci?: number;
	nrtac?: number;
	supports_nr_redcap?: boolean;
} | null;

export type Cell = {
	id: number;
	rat: string;
	station_id: number;
	notes: string | null;
	is_confirmed: boolean;
	updatedAt: string;
	createdAt: string;
	band: Band;
	details: CellDetails;
};

export type NetWorkS = {
	id: number;
	station_id: number;
	networks_id: number;
	updatedAt: string;
	createdAt: string;
};

export type Station = {
	id: number;
	station_id: string;
	location_id: number;
	operator_id: number;
	notes: string | null;
	updatedAt: string;
	createdAt: string;
	is_confirmed: boolean;
	cells: Cell[];
	location: Location;
	operator: Operator;
	networks?: NetWorkS;
};

export type StationSource = "internal" | "uke";

export type StationFilters = {
	operators: number[];
	bands: number[];
	rat: string[];
	source: StationSource;
};

export type StationWithoutCells = Omit<Station, "location" | "cells"> & {
	cells?: Cell[];
};

export type LocationInfo = {
	id: number;
	city?: string;
	address?: string;
	latitude: number;
	longitude: number;
};

export type LocationWithStations = LocationInfo & {
	updatedAt: string;
	createdAt: string;
	region: Region;
	stations: StationWithoutCells[];
};

export type UkePermit = {
	id: number;
	case_id: string;
	address: string;
	city: string;
	latitude: number;
	longitude: number;
	expiry_date: string | null;
	is_active: boolean;
	operator?: Operator;
	band?: Band;
	createdAt: string;
	updatedAt: string;
};

export type CommentAttachment = {
	uuid: string;
	type: string;
};

export type StationComment = {
	id: number;
	station_id: number;
	author_id: number;
	content: string;
	createdAt: string;
	updatedAt: string;
	attachments?: CommentAttachment[];
	author?: {
		id: number;
		name: string;
		avatar_url: string | null;
	};
};
