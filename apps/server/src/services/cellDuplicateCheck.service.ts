import { and, eq, ne } from "drizzle-orm";
import { cells, gsmCells, umtsCells, lteCells, stations } from "@openbts/drizzle";

import db from "../database/psql.js";
import { ErrorResponse } from "../errors.js";

/**
 * Checks for duplicate GSM cells (LAC + CID) within the same operator.
 * @param lac - Location Area Code
 * @param cid - Cell ID
 * @param operatorId - Operator ID to scope the check
 * @param excludeCellId - Cell ID to exclude (for updates)
 */
export async function checkGSMDuplicate(lac: number, cid: number, operatorId: number, excludeCellId?: number) {
  const existing = await db
    .select({ id: gsmCells.cell_id })
    .from(gsmCells)
    .innerJoin(cells, eq(cells.id, gsmCells.cell_id))
    .innerJoin(stations, eq(stations.id, cells.station_id))
    .where(
      and(
        eq(gsmCells.lac, lac),
        eq(gsmCells.cid, cid),
        eq(stations.operator_id, operatorId),
        excludeCellId ? ne(gsmCells.cell_id, excludeCellId) : undefined,
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ErrorResponse("DUPLICATE_ENTRY", {
      message: `A GSM cell with LAC ${lac} and CID ${cid} already exists for this operator`,
    });
  }
}

/**
 * Checks for duplicate UMTS cells (RNC + CID) within the same operator.
 * @param rnc - Radio Network Controller ID
 * @param cid - Cell ID
 * @param operatorId - Operator ID to scope the check
 * @param excludeCellId - Cell ID to exclude (for updates)
 */
export async function checkUMTSDuplicate(rnc: number, cid: number, operatorId: number, excludeCellId?: number) {
  const existing = await db
    .select({ id: umtsCells.cell_id })
    .from(umtsCells)
    .innerJoin(cells, eq(cells.id, umtsCells.cell_id))
    .innerJoin(stations, eq(stations.id, cells.station_id))
    .where(
      and(
        eq(umtsCells.rnc, rnc),
        eq(umtsCells.cid, cid),
        eq(stations.operator_id, operatorId),
        excludeCellId ? ne(umtsCells.cell_id, excludeCellId) : undefined,
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ErrorResponse("DUPLICATE_ENTRY", {
      message: `A UMTS cell with RNC ${rnc} and CID ${cid} already exists for this operator`,
    });
  }
}

/**
 * Checks for duplicate LTE cells (eNBID + CLID) within the same operator.
 * @param enbid - eNodeB ID
 * @param clid - Cell Local ID
 * @param operatorId - Operator ID to scope the check
 * @param excludeCellId - Cell ID to exclude (for updates)
 */
export async function checkLTEDuplicate(enbid: number, clid: number, operatorId: number, excludeCellId?: number) {
  const existing = await db
    .select({ id: lteCells.cell_id })
    .from(lteCells)
    .innerJoin(cells, eq(cells.id, lteCells.cell_id))
    .innerJoin(stations, eq(stations.id, cells.station_id))
    .where(
      and(
        eq(lteCells.enbid, enbid),
        eq(lteCells.clid, clid),
        eq(stations.operator_id, operatorId),
        excludeCellId ? ne(lteCells.cell_id, excludeCellId) : undefined,
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ErrorResponse("DUPLICATE_ENTRY", {
      message: `An LTE cell with eNBID ${enbid} and CLID ${clid} already exists for this operator`,
    });
  }
}

/**
 * Resolves the operator_id for a given station.
 */
export async function getOperatorIdForStation(stationId: number): Promise<number | null> {
  const station = await db.query.stations.findFirst({
    where: { id: stationId },
    columns: { operator_id: true },
  });
  return station?.operator_id ?? null;
}
