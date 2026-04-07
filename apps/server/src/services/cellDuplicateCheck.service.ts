import { cells, gsmCells, lteCells, stations, umtsCells } from "@openbts/drizzle";
import { and, eq, ne, or } from "drizzle-orm";

import db from "../database/psql.js";
import { ErrorResponse } from "../errors.js";

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

interface CellDuplicateEntry {
  rat: string;
  details: Record<string, unknown>;
  excludeCellId?: number;
}

export async function checkCellDuplicatesBatch(cellEntries: CellDuplicateEntry[], operatorId: number): Promise<void> {
  const gsmEntries = cellEntries.filter((c) => c.rat === "GSM");
  const umtsEntries = cellEntries.filter((c) => c.rat === "UMTS");
  const lteEntries = cellEntries.filter((c) => c.rat === "LTE");

  const checks: Promise<void>[] = [];

  if (gsmEntries.length > 0) {
    checks.push(
      (async () => {
        const conditions = gsmEntries.map((e) => {
          const d = e.details as { lac: number; cid: number };
          return and(eq(gsmCells.lac, d.lac), eq(gsmCells.cid, d.cid), e.excludeCellId ? ne(gsmCells.cell_id, e.excludeCellId) : undefined);
        });

        const existing = await db
          .select({ lac: gsmCells.lac, cid: gsmCells.cid })
          .from(gsmCells)
          .innerJoin(cells, eq(cells.id, gsmCells.cell_id))
          .innerJoin(stations, eq(stations.id, cells.station_id))
          .where(and(eq(stations.operator_id, operatorId), or(...conditions)));

        if (existing.length > 0) {
          const dup = existing[0]!;
          throw new ErrorResponse("DUPLICATE_ENTRY", {
            message: `A GSM cell with LAC ${dup.lac} and CID ${dup.cid} already exists for this operator`,
          });
        }
      })(),
    );
  }

  if (umtsEntries.length > 0) {
    checks.push(
      (async () => {
        const conditions = umtsEntries.map((e) => {
          const d = e.details as { rnc: number; cid: number };
          return and(eq(umtsCells.rnc, d.rnc), eq(umtsCells.cid, d.cid), e.excludeCellId ? ne(umtsCells.cell_id, e.excludeCellId) : undefined);
        });

        const existing = await db
          .select({ rnc: umtsCells.rnc, cid: umtsCells.cid })
          .from(umtsCells)
          .innerJoin(cells, eq(cells.id, umtsCells.cell_id))
          .innerJoin(stations, eq(stations.id, cells.station_id))
          .where(and(eq(stations.operator_id, operatorId), or(...conditions)));

        if (existing.length > 0) {
          const dup = existing[0]!;
          throw new ErrorResponse("DUPLICATE_ENTRY", {
            message: `A UMTS cell with RNC ${dup.rnc} and CID ${dup.cid} already exists for this operator`,
          });
        }
      })(),
    );
  }

  if (lteEntries.length > 0) {
    checks.push(
      (async () => {
        const conditions = lteEntries.map((e) => {
          const d = e.details as { enbid: number; clid: number };
          return and(eq(lteCells.enbid, d.enbid), eq(lteCells.clid, d.clid), e.excludeCellId ? ne(lteCells.cell_id, e.excludeCellId) : undefined);
        });

        const existing = await db
          .select({ enbid: lteCells.enbid, clid: lteCells.clid })
          .from(lteCells)
          .innerJoin(cells, eq(cells.id, lteCells.cell_id))
          .innerJoin(stations, eq(stations.id, cells.station_id))
          .where(and(eq(stations.operator_id, operatorId), or(...conditions)));

        if (existing.length > 0) {
          const dup = existing[0]!;
          throw new ErrorResponse("DUPLICATE_ENTRY", {
            message: `An LTE cell with eNBID ${dup.enbid} and CLID ${dup.clid} already exists for this operator`,
          });
        }
      })(),
    );
  }

  await Promise.all(checks);
}

export async function getOperatorIdForStation(stationId: number): Promise<number | null> {
  const station = await db.query.stations.findFirst({
    where: { id: stationId },
    columns: { operator_id: true },
  });
  return station?.operator_id ?? null;
}
