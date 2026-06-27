import { ukePermits, ukeStations } from "@openbts/drizzle";
import { db } from "@openbts/drizzle/db";
import { sql } from "drizzle-orm";

import { BATCH_SIZE } from "./config.js";
import { chunk } from "./utils.js";

export interface UkeStationTuple {
  station_id: string;
  operator_id: number;
  location_id: number;
  createdAt: Date;
  updatedAt: Date;
}

export function getUkeStationKey(station: Pick<UkeStationTuple, "station_id" | "operator_id" | "location_id">): string {
  return `${station.station_id}:${station.operator_id}:${station.location_id}`;
}

export async function resolveUkeStationIds(stations: UkeStationTuple[]): Promise<Map<string, number>> {
  const uniqueByKey = new Map<string, UkeStationTuple>();
  for (const station of stations) {
    const key = getUkeStationKey(station);
    const existing = uniqueByKey.get(key);
    if (!existing || station.updatedAt > existing.updatedAt) uniqueByKey.set(key, station);
  }

  const unique = Array.from(uniqueByKey.values());
  if (!unique.length) return new Map();

  const existing = await fetchUkeStations(unique);
  const toInsert = unique.filter((station) => !existing.has(getUkeStationKey(station)));

  if (!toInsert.length) return existing;

  for (const group of chunk(toInsert, BATCH_SIZE)) {
    if (!group.length) continue;
    await db
      .insert(ukeStations)
      .values(group)
      .onConflictDoNothing({ target: [ukeStations.station_id, ukeStations.operator_id, ukeStations.location_id] });
  }

  const newlyResolved = await fetchUkeStations(toInsert);
  return new Map([...existing, ...newlyResolved]);
}

export async function refreshUkeStationActivity(stationIds: Iterable<number>): Promise<void> {
  const ids = [...new Set(stationIds)];
  if (!ids.length) return;

  for (const group of chunk(ids, BATCH_SIZE)) {
    const idsSql = sql.join(
      group.map((id) => sql`${id}`),
      sql`, `,
    );

    await db.execute(sql`
      UPDATE ${ukeStations}
      SET "updatedAt" = permit_activity.updated_at
      FROM (
        SELECT ${ukePermits.uke_station_id} AS uke_station_id, MAX(${ukePermits.updatedAt}) AS updated_at
        FROM ${ukePermits}
        WHERE ${ukePermits.uke_station_id} IN (${idsSql})
        GROUP BY ${ukePermits.uke_station_id}
      ) AS permit_activity
      WHERE ${ukeStations.id} = permit_activity.uke_station_id
    `);
  }
}

export async function cleanupOrphanedUkeStations(): Promise<number> {
  const deleted = await db
    .delete(ukeStations)
    .where(sql`NOT EXISTS (SELECT 1 FROM ${ukePermits} WHERE ${ukePermits.uke_station_id} = ${ukeStations.id})`)
    .returning({ id: ukeStations.id });
  return deleted.length;
}

async function fetchUkeStations(stations: UkeStationTuple[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const group of chunk(stations, BATCH_SIZE)) {
    if (!group.length) continue;
    const rows = await db
      .select({
        id: ukeStations.id,
        station_id: ukeStations.station_id,
        operator_id: ukeStations.operator_id,
        location_id: ukeStations.location_id,
      })
      .from(ukeStations)
      .where(
        sql`(${ukeStations.station_id}, ${ukeStations.operator_id}, ${ukeStations.location_id}) IN (${sql.join(
          group.map((station) => sql`(${station.station_id}, ${station.operator_id}, ${station.location_id})`),
          sql`, `,
        )})`,
      );
    for (const row of rows) map.set(getUkeStationKey(row), row.id);
  }
  return map;
}
