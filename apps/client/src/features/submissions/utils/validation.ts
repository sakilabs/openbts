import { isARFCNValidForBand } from "@/features/station-details/frequencyCalc";
import type { Band } from "@/types/station";

import type { SearchStation } from "../api";
import type {
  GSMCellDetails,
  LTECellDetails,
  NRCellDetails,
  ProposedCellForm,
  ProposedLocationForm,
  ProposedStationForm,
  RatType,
  SubmissionMode,
  UMTSCellDetails,
} from "../types";
import { type CellLike, findDuplicateCids, findDuplicateEnbidClids } from "./cellDuplicates";

export type StationErrors = {
  station_id?: string;
  operator_id?: string;
};

export type LocationErrors = {
  latitude?: string;
  longitude?: string;
  region_id?: string;
};

export type CellError = {
  band_id?: string;
  details?: Record<string, string>;
};

export type FormErrors = {
  station?: StationErrors;
  location?: LocationErrors;
  cells?: Record<string, CellError>;
  general?: string;
};

type ValidationContext = {
  mode: SubmissionMode;
  selectedStation: SearchStation | null;
  newStation: ProposedStationForm;
  location: ProposedLocationForm;
  cells: ProposedCellForm[];
  bands?: Band[];
};

export function validateForm(ctx: ValidationContext): FormErrors {
  const errors: FormErrors = {};

  if (ctx.mode === "existing") {
    if (!ctx.selectedStation) errors.general = "validation.selectStation";
  } else {
    const stationErrors = validateStation(ctx.newStation);
    if (Object.keys(stationErrors).length > 0) errors.station = stationErrors;
  }

  const locationErrors = validateLocation(ctx.location);
  if (Object.keys(locationErrors).length > 0) errors.location = locationErrors;

  const cellErrors = validateCells(ctx.cells, ctx.bands);
  if (Object.keys(cellErrors).length > 0) errors.cells = cellErrors;

  return errors;
}

function validateStation(station: ProposedStationForm): StationErrors {
  const errors: StationErrors = {};

  if (!station.station_id.trim()) errors.station_id = "validation.stationIdRequired";
  else if (station.station_id.length < 2) errors.station_id = "validation.stationIdTooShort";

  if (station.operator_id === null) errors.operator_id = "validation.operatorRequired";

  return errors;
}

function validateLocation(location: ProposedLocationForm): LocationErrors {
  const errors: LocationErrors = {};

  if (location.latitude === null) errors.latitude = "validation.latitudeRequired";
  else if (location.latitude < -90 || location.latitude > 90) errors.latitude = "validation.latitudeInvalid";

  if (location.longitude === null) errors.longitude = "validation.longitudeRequired";
  else if (location.longitude < -180 || location.longitude > 180) errors.longitude = "validation.longitudeInvalid";

  if (location.region_id === null) errors.region_id = "validation.regionRequired";

  return errors;
}

export function validateCells(cells: ProposedCellForm[], bands?: Band[]): Record<string, CellError> {
  const errors: Record<string, CellError> = {};
  const bandMap = bands ? new Map(bands.map((b) => [b.id, b])) : null;

  for (const cell of cells) {
    const band = cell.band_id !== null ? (bandMap?.get(cell.band_id) ?? null) : null;
    const cellError = validateCell(cell, band);
    if (Object.keys(cellError).length > 0) errors[cell.id] = cellError;
  }

  const cellLikes: CellLike[] = cells.map((c) => ({ id: c.id, rat: c.rat, details: c.details }));

  for (const [_, duplicateIds] of findDuplicateCids(cellLikes)) {
    for (const cellId of duplicateIds) {
      if (!errors[cellId]) errors[cellId] = {};
      if (!errors[cellId].details) errors[cellId].details = {};
      errors[cellId].details!.cid = "validation.cidDuplicate";
    }
  }

  for (const cellId of findDuplicateEnbidClids(cellLikes)) {
    if (!errors[cellId]) errors[cellId] = {};
    if (!errors[cellId].details) errors[cellId].details = {};
    errors[cellId].details!.enbid = "validation.enbidClidDuplicate";
    errors[cellId].details!.clid = "validation.enbidClidDuplicate";
  }

  return errors;
}

function validateCell(cell: ProposedCellForm, band: Band | null): CellError {
  const error: CellError = {};

  if (cell.band_id === null) error.band_id = "validation.bandRequired";

  const detailErrors = validateCellDetails(cell.rat, cell.details, band);
  if (Object.keys(detailErrors).length > 0) error.details = detailErrors;

  return error;
}

function validateCellDetails(rat: RatType, details: Partial<ProposedCellForm["details"]>, band: Band | null): Record<string, string> {
  const errors: Record<string, string> = {};

  const requireNonNegative = (field: string, value: number | undefined) => {
    if (value === undefined) errors[field] = `validation.${field}Required`;
    else if (value < 0) errors[field] = "validation.mustBePositive";
  };

  const optionalNonNegative = (field: string, value: number | undefined) => {
    if (value !== undefined && value < 0) errors[field] = "validation.mustBePositive";
  };

  switch (rat) {
    case "GSM": {
      const d = details as Partial<GSMCellDetails>;
      requireNonNegative("lac", d.lac);
      requireNonNegative("cid", d.cid);
      break;
    }
    case "UMTS": {
      const d = details as Partial<UMTSCellDetails>;
      optionalNonNegative("lac", d.lac);
      requireNonNegative("cid", d.cid);
      requireNonNegative("rnc", d.rnc);
      optionalNonNegative("arfcn", d.arfcn);
      if (d.arfcn !== undefined && band?.value !== undefined && !isARFCNValidForBand("UMTS", band.value, d.arfcn))
        errors.arfcn = "validation.arfcnBandMismatch";
      break;
    }
    case "LTE": {
      const d = details as Partial<LTECellDetails>;
      optionalNonNegative("tac", d.tac);
      requireNonNegative("enbid", d.enbid);
      requireNonNegative("clid", d.clid);
      if (d.clid !== undefined && d.clid > 255) errors.clid = "validation.clidRangeInvalid";
      optionalNonNegative("pci", d.pci);
      if (d.pci !== undefined && d.pci > 503) errors.pci = "validation.pciRangeInvalid";
      optionalNonNegative("earfcn", d.earfcn);
      if (d.earfcn !== undefined && band?.value !== undefined && !isARFCNValidForBand("LTE", band.value, d.earfcn, band.duplex))
        errors.earfcn = "validation.arfcnBandMismatch";
      break;
    }
    case "NR": {
      const d = details as Partial<NRCellDetails>;
      if (d.type !== undefined && d.type !== "nsa" && d.type !== "sa") errors.type = "validation.typeInvalid";
      else if (d.type === undefined || d?.type === null) errors.type = "validation.typeRequired";

      optionalNonNegative("nrtac", d.nrtac);
      optionalNonNegative("gnbid", d.gnbid);
      optionalNonNegative("clid", d.clid);
      optionalNonNegative("pci", d.pci);
      if (d.type === "sa") {
        optionalNonNegative("arfcn", d.arfcn);
        if (d.arfcn !== undefined && !isARFCNValidForBand("NR", band?.value ?? 0, d.arfcn)) errors.arfcn = "validation.arfcnBandMismatch";
      }
      break;
    }
  }

  return errors;
}

export function hasErrors(errors: FormErrors): boolean {
  return (
    !!errors.general ||
    (!!errors.station && Object.keys(errors.station).length > 0) ||
    (!!errors.location && Object.keys(errors.location).length > 0) ||
    (!!errors.cells && Object.keys(errors.cells).length > 0)
  );
}
