import type {
  ProposedStationForm,
  ProposedLocationForm,
  ProposedCellForm,
  RatType,
  GSMCellDetails,
  UMTSCellDetails,
  LTECellDetails,
  NRCellDetails,
  SubmissionMode,
} from "../types";
import type { SearchStation } from "../api";

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

  const cellErrors = validateCells(ctx.cells);
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

export function validateCells(cells: ProposedCellForm[]): Record<string, CellError> {
  const errors: Record<string, CellError> = {};

  for (const cell of cells) {
    const cellError = validateCell(cell);
    if (Object.keys(cellError).length > 0) errors[cell.id] = cellError;
  }

  return errors;
}

function validateCell(cell: ProposedCellForm): CellError {
  const error: CellError = {};

  if (cell.band_id === null) error.band_id = "validation.bandRequired";

  const detailErrors = validateCellDetails(cell.rat, cell.details);
  if (Object.keys(detailErrors).length > 0) error.details = detailErrors;

  return error;
}

function validateCellDetails(rat: RatType, details: Partial<ProposedCellForm["details"]>): Record<string, string> {
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
      optionalNonNegative("carrier", d.carrier);
      break;
    }
    case "LTE": {
      const d = details as Partial<LTECellDetails>;
      optionalNonNegative("tac", d.tac);
      requireNonNegative("enbid", d.enbid);
      requireNonNegative("clid", d.clid);
      if (d.clid !== undefined && d.clid > 255) errors.clid = "validation.clidRangeInvalid";
      break;
    }
    case "NR": {
      const d = details as Partial<NRCellDetails>;
      optionalNonNegative("nrtac", d.nrtac);
      requireNonNegative("gnbid", d.gnbid);
      optionalNonNegative("clid", d.clid);
      optionalNonNegative("pci", d.pci);
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
