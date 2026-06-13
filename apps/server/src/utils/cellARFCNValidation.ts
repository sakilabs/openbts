import { isARFCNValidForBand } from "@openbts/shared/frequency";

import db from "../database/psql.js";
import { ErrorResponse } from "../errors.js";

type CellARFCNDetails = {
  arfcn?: number | null;
  earfcn?: number | null;
};

type CellARFCNCandidate = {
  rat?: string | null;
  band_id?: number | null;
  details?: unknown;
};

export function formatARFCNBandErrorMessage(rat: string, bandValue: number, arfcn: number): string {
  const label = rat === "LTE" ? "EARFCN" : rat === "UMTS" ? "UARFCN" : "ARFCN";
  return `${label} ${arfcn} is not valid for \`${rat}${bandValue}\``;
}

export async function validateCellARFCNsForBands(candidates: CellARFCNCandidate[]): Promise<void> {
  const bandIds = [...new Set(candidates.flatMap((cell) => (cell.band_id !== null && cell.band_id !== undefined ? [cell.band_id] : [])))];
  if (bandIds.length === 0) return;

  const bandRows = await db.query.bands.findMany({
    where: {
      RAW: (fields, { inArray }) => inArray(fields.id, bandIds),
    },
  });
  const bandById = new Map(bandRows.map((band) => [band.id, band]));

  for (const cell of candidates) {
    if (cell.band_id === null || cell.band_id === undefined || !cell.rat) continue;
    if (cell.rat !== "UMTS" && cell.rat !== "LTE" && cell.rat !== "NR") continue;

    const details = cell.details as CellARFCNDetails | null | undefined;
    const arfcn = cell.rat === "LTE" ? details?.earfcn : details?.arfcn;
    if (arfcn === null || arfcn === undefined) continue;

    const band = bandById.get(cell.band_id);
    if (!band) continue;
    if (band.value === null) continue;
    if (!isARFCNValidForBand(cell.rat, band.value, arfcn, band.duplex))
      throw new ErrorResponse("BAD_REQUEST", { message: formatARFCNBandErrorMessage(cell.rat, band.value, arfcn) });
  }
}
