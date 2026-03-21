import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import { proposedCells, proposedGSMCells, proposedUMTSCells, proposedLTECells, proposedNRCells } from "@openbts/drizzle";
import { ErrorResponse } from "../errors.js";

export const gsmInsertSchema = createInsertSchema(proposedGSMCells)
  .omit({ proposed_cell_id: true })
  .extend({ lac: z.number().int().min(0).max(65535), cid: z.number().int().min(0).max(65535) })
  .strict();
export const umtsInsertSchema = createInsertSchema(proposedUMTSCells)
  .omit({ proposed_cell_id: true })
  .extend({
    lac: z.number().int().min(0).max(65535).nullable().optional(),
    rnc: z.number().int().min(0).max(65535),
    cid: z.number().int().min(0).max(65535),
    arfcn: z.number().int().min(0).max(16383).nullable().optional(),
  })
  .strict();
export const lteInsertSchema = createInsertSchema(proposedLTECells)
  .omit({ proposed_cell_id: true })
  .extend({
    enbid: z.number().int().min(0).max(1048575),
    clid: z.number().int().min(0).max(255),
    pci: z.number().int().min(0).max(503).nullable().optional(),
    earfcn: z.number().int().min(0).max(262143).nullable().optional(),
  })
  .strict();
export const nrInsertSchemaBase = createInsertSchema(proposedNRCells)
  .omit({ proposed_cell_id: true })
  .extend({
    nrtac: z.number().int().min(0).max(16777215).nullable().optional(),
    gnbid: z.number().int().min(0).max(4294967295).nullable().optional(),
    clid: z.number().int().min(0).max(16383).nullable().optional(),
    pci: z.number().int().min(0).max(1007).nullable().optional(),
    arfcn: z.number().int().min(0).max(3279165).nullable().optional(),
  })
  .strict();

export const gsmSelectSchema = createSelectSchema(proposedGSMCells).omit({ proposed_cell_id: true });
export const umtsSelectSchema = createSelectSchema(proposedUMTSCells).omit({ proposed_cell_id: true });
export const lteSelectSchema = createSelectSchema(proposedLTECells).omit({ proposed_cell_id: true });
export const nrSelectSchema = createSelectSchema(proposedNRCells).omit({ proposed_cell_id: true });
export const detailsSelectSchema = z.union([gsmSelectSchema, umtsSelectSchema, lteSelectSchema, nrSelectSchema]).nullable();

export const proposedCellsSelectSchema = createSelectSchema(proposedCells);

export function computeGnbidLength(gnbid: number | null | undefined): number | undefined {
  if (gnbid === null || gnbid === undefined) return undefined;
  return Number(gnbid).toString(2).length;
}

export function isNonEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return true;
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.some(isNonEmpty);
  if (typeof value === "object") return Object.values(value as object).some(isNonEmpty);
  return false;
}

interface CellWithDetails {
  rat?: string | null;
  operation?: string | null;
  details?: { lac?: number | null; cid?: number | null; rnc?: number | null; enbid?: number | null; clid?: number | null } | null;
}

export function validateCellDuplicates(cells: CellWithDetails[]): void {
  for (const rat of ["GSM", "UMTS"] as const) {
    const ratCells = cells.filter((c) => c.rat === rat && c.operation !== "delete");
    const seen = new Set<string>();
    for (const cell of ratCells) {
      const d = cell.details as { lac?: number; rnc?: number; cid?: number } | undefined;
      const cid = d?.cid;
      if (cid === undefined) continue;
      const key = rat === "GSM" ? `${d?.lac ?? 0}:${cid}` : `${d?.rnc ?? 0}:${cid}`;
      if (seen.has(key))
        throw new ErrorResponse("BAD_REQUEST", {
          message:
            rat === "GSM" ? `Duplicate LAC+CID (${d?.lac}+${cid}) found in GSM cells` : `Duplicate RNC+CID (${d?.rnc}+${cid}) found in UMTS cells`,
        });
      seen.add(key);
    }
  }

  const lteCells = cells.filter((c) => c.rat === "LTE" && c.operation !== "delete");
  const seen = new Set<string>();
  for (const cell of lteCells) {
    const d = cell.details as { enbid?: number; clid?: number } | undefined;
    if (d?.enbid === undefined || d?.clid === undefined) continue;
    const key = `${d.enbid}:${d.clid}`;
    if (seen.has(key)) throw new ErrorResponse("BAD_REQUEST", { message: `Duplicate eNBID+CLID (${d.enbid}+${d.clid}) found in LTE cells` });
    seen.add(key);
  }
}

export async function insertProposedCellDetails(
  tx: { insert: (table: any) => any },
  rat: string | null | undefined,
  details: Record<string, unknown> | null | undefined,
  proposedCellId: number,
): Promise<void> {
  if (!details) return;
  switch (rat) {
    case "GSM":
      await tx.insert(proposedGSMCells).values({ ...(details as z.infer<typeof gsmInsertSchema>), proposed_cell_id: proposedCellId });
      break;
    case "UMTS":
      await tx.insert(proposedUMTSCells).values({ ...(details as z.infer<typeof umtsInsertSchema>), proposed_cell_id: proposedCellId });
      break;
    case "LTE":
      await tx.insert(proposedLTECells).values({ ...(details as z.infer<typeof lteInsertSchema>), proposed_cell_id: proposedCellId });
      break;
    case "NR": {
      const nrDetails = details as z.infer<typeof nrInsertSchemaBase>;
      await tx.insert(proposedNRCells).values({
        ...nrDetails,
        proposed_cell_id: proposedCellId,
        gnbid_length: computeGnbidLength(nrDetails.gnbid),
      });
      break;
    }
  }
}
