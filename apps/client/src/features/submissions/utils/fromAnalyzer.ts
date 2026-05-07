import type { CellFormDetails, GSMCellDetails, LTECellDetails, SubmissionFormData, UMTSCellDetails } from "../types";
import type { AnalyzerDraft } from "./analyzerDraftStore";

export type MismatchDetails = Partial<GSMCellDetails & UMTSCellDetails & LTECellDetails>;

export interface DraftCell {
  _rowIndex: number;
  operation: "add" | "update";
  rat: "GSM" | "UMTS" | "LTE" | "NR";
  target_cell_id: number | undefined;
  band_id: number | null;
  details: MismatchDetails;
  baseDetails?: MismatchDetails;
  warningKeys: string[];
  conflict: boolean;
}

export interface DraftStation {
  stationInternalId: number;
  station_id: string;
  operatorMnc: number | null;
  cells: DraftCell[];
  hasConflicts: boolean;
}

export interface AnalyzerBatchDraft {
  stations: DraftStation[];
  metadata: {
    fileName?: string | null;
    fileFormat?: string | null;
    parsedRows: number;
  };
  unresolvedBandRows: number[];
}

const CELL_DETAIL_KEYS: Record<string, readonly string[]> = {
  GSM: ["lac", "cid", "e_gsm"],
  UMTS: ["lac", "arfcn", "rnc", "cid"],
  LTE: ["tac", "enbid", "clid", "pci", "earfcn", "supports_iot"],
};

function pickMismatchDetails(rat: "GSM" | "UMTS" | "LTE" | "NR", details: MismatchDetails) {
  const keys = CELL_DETAIL_KEYS[rat] ?? [];
  return Object.fromEntries(keys.filter((key) => key in details).map((key) => [key, details[key as keyof MismatchDetails]]));
}

export function buildAnalyzerBatchDraft(draft: AnalyzerDraft): AnalyzerBatchDraft {
  const stationMap = new Map<number, DraftStation>();
  const cellConflictTracker = new Map<string, MismatchDetails>();
  const unresolvedBandRows: number[] = [];

  for (const idx of draft.selectedIndexes) {
    if (!draft.parsedRows || !draft.results) break;
    const row = draft.parsedRows[idx];
    const result = draft.results[idx];
    if (!result.station || (result.status !== "found" && result.status !== "probable")) continue;

    const stationInternalId = result.station.id;
    const warnings: string[] = result.warnings ?? [];
    const details: MismatchDetails = {};
    let baseDetails: MismatchDetails | undefined;
    let operation: "add" | "update" = "update";
    let target_cell_id: number | undefined;
    let band_id: number | null = null;

    if (result.status === "found" && result.cell) {
      const cell = result.cell;
      target_cell_id = result.cell.cell_id;
      band_id = result.cell.band_id ?? null;

      if (cell.rat === "GSM" && row.rat === "GSM") {
        baseDetails = { lac: cell.lac, cid: cell.cid };
        if (warnings.includes("lac_mismatch")) details.lac = row.lac;
      } else if (cell.rat === "UMTS" && row.rat === "UMTS") {
        baseDetails = {
          rnc: cell.rnc,
          cid: cell.cid,
          ...(cell.lac !== null && { lac: cell.lac }),
          ...(cell.arfcn !== null && { arfcn: cell.arfcn }),
        };
        if (warnings.includes("lac_mismatch")) details.lac = row.lac;
        if (warnings.includes("uarfcn_mismatch")) details.arfcn = row.uarfcn;
      } else if (cell.rat === "LTE" && row.rat === "LTE") {
        baseDetails = {
          enbid: cell.enbid,
          ...(cell.clid !== null && { clid: cell.clid }),
          ...(cell.tac !== null && { tac: cell.tac }),
          ...(cell.pci !== null && { pci: cell.pci }),
          ...(cell.earfcn !== null && { earfcn: cell.earfcn }),
        };
        if (warnings.includes("tac_mismatch")) details.tac = row.tac;
        if (warnings.includes("pci_mismatch") || warnings.includes("pci_missing")) details.pci = row.pci;
        if (warnings.includes("earfcn_mismatch")) details.earfcn = row.earfcn;
      }
    } else if (result.status === "probable" && warnings.includes("enbid_only") && row.rat === "LTE") {
      operation = "add";
      details.enbid = row.enbid;
      details.clid = row.clid;
      details.tac = row.tac;
      details.pci = row.pci;
      details.earfcn = row.earfcn;
      if (!band_id) unresolvedBandRows.push(idx);
    } else if (result.status === "probable" && warnings.includes("rnc_mismatch") && result.cell?.rat === "UMTS" && row.rat === "UMTS") {
      const cell = result.cell;
      target_cell_id = cell?.cell_id;
      band_id = cell?.band_id ?? null;
      baseDetails = { rnc: cell.rnc, cid: cell.cid, ...(cell.lac !== null && { lac: cell.lac }), ...(cell.arfcn !== null && { arfcn: cell.arfcn }) };
      details.rnc = row.rnc ?? undefined;
    }

    let conflict = false;
    if (target_cell_id !== undefined) {
      const conflictKey = `${stationInternalId}:${target_cell_id}`;
      const seen = cellConflictTracker.get(conflictKey);
      if (seen) {
        conflict = (Object.keys(details) as (keyof MismatchDetails)[]).some((k) => k in seen && seen[k] !== details[k]);
        Object.assign(seen, details);
      } else cellConflictTracker.set(conflictKey, details);
    }
    const changedCell: DraftCell = {
      _rowIndex: idx,
      operation,
      rat: row.rat,
      target_cell_id,
      band_id,
      details,
      baseDetails,
      warningKeys: warnings,
      conflict,
    };

    const existing = stationMap.get(stationInternalId);
    if (existing) {
      existing.cells.push(changedCell);
      if (conflict) existing.hasConflicts = true;
    } else {
      stationMap.set(stationInternalId, {
        stationInternalId,
        station_id: result.station.station_id,
        operatorMnc: result.station.operator?.mnc ?? null,
        cells: [changedCell],
        hasConflicts: conflict,
      });
    }
  }

  return {
    stations: [...stationMap.values()],
    metadata: {
      fileName: draft.metadata.fileName,
      fileFormat: draft.metadata.fileFormat,
      parsedRows: draft.parsedCount,
    },
    unresolvedBandRows,
  };
}

export function buildSubmissionPayloads(draft: AnalyzerBatchDraft): SubmissionFormData[] {
  return draft.stations.map((station) => ({
    station_id: station.stationInternalId,
    type: "update",
    cells: station.cells.map((cell) => ({
      operation: cell.operation,
      target_cell_id: cell.target_cell_id,
      band_id: cell.band_id,
      rat: cell.rat,
      details: {
        ...pickMismatchDetails(cell.rat, cell.baseDetails ?? {}),
        ...pickMismatchDetails(cell.rat, cell.details),
      } as Partial<CellFormDetails>,
    })),
  }));
}
