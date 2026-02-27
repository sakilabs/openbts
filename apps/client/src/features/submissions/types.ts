import type { Band, Operator, Region } from "@/types/station";
import type { RatType } from "@/features/shared/rat";

export type { RatType };

export type GSMCellDetails = {
  lac: number;
  cid: number;
  e_gsm?: boolean;
};

export type UMTSCellDetails = {
  lac?: number;
  arfcn?: number;
  rnc: number;
  cid: number;
};

export type LTECellDetails = {
  tac?: number;
  enbid: number;
  clid: number;
  pci?: number;
  supports_nb_iot?: boolean;
};

export type NRType = "nsa" | "sa";

export type NRCellDetails = {
  type?: NRType;
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
  networks_id?: number | null;
  networks_name?: string | null;
  mno_name?: string | null;
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
  submitter_note?: string;
  station?: ProposedStationForm;
  location?: ProposedLocationForm;
  cells: CellPayload[];
};

export type SubmissionMode = "existing" | "new";

export type StationAction = "update" | "delete";

export type { Band, Operator, Region };
