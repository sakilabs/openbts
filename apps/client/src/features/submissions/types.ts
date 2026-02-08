import type { Band, Operator, Region } from "@/types/station";

export type RatType = "GSM" | "UMTS" | "LTE" | "NR";

export type GSMCellDetails = {
	lac: number;
	cid: number;
	is_egsm?: boolean;
};

export type UMTSCellDetails = {
	lac?: number;
	carrier?: number;
	rnc: number;
	cid: number;
};

export type LTECellDetails = {
	tac?: number;
	enbid: number;
	clid: number;
	supports_nb_iot?: boolean;
};

export type NRCellDetails = {
	nrtac?: number;
	gnbid?: number;
	clid?: number;
	nci?: number;
	pci?: number;
	supports_nr_redcap?: boolean;
};

export type CellFormDetails = GSMCellDetails | UMTSCellDetails | LTECellDetails | NRCellDetails;

export type ProposedCellForm = {
	id: string;
	existingCellId?: number;
	rat: RatType;
	band_id: number | null;
	notes?: string;
	is_confirmed?: boolean;
	details: Partial<CellFormDetails>;
};

export type ProposedStationForm = {
	station_id: string;
	operator_id: number | null;
	notes?: string;
};

export type ProposedLocationForm = {
	region_id: number | null;
	city?: string;
	address?: string;
	longitude: number | null;
	latitude: number | null;
};

export type CellOperation = "added" | "updated" | "removed";

export type CellPayload = {
	operation: CellOperation;
	target_cell_id?: number;
	band_id?: number | null;
	rat?: RatType;
	notes?: string | null;
	details?: Partial<CellFormDetails>;
};

export type SubmissionFormData = {
	station_id: number | null;
	type: "new" | "update" | "delete";
	station?: ProposedStationForm;
	location?: ProposedLocationForm;
	cells: CellPayload[];
};

export type SubmissionMode = "existing" | "new";

export type { Band, Operator, Region };
