import { sql, count, countDistinct } from "drizzle-orm";
import { db } from "../database/psql.js";
import { ukePermits, statsSnapshots } from "@openbts/drizzle";
import { logger } from "../utils/logger.js";

export async function takeStatsSnapshot(): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const rows = await db
    .select({
      operator_id: ukePermits.operator_id,
      band_id: ukePermits.band_id,
      unique_stations_count: countDistinct(ukePermits.station_id),
      permits_count: count(),
    })
    .from(ukePermits)
    .groupBy(ukePermits.operator_id, ukePermits.band_id);

  if (rows.length === 0) {
    logger.info("Stats snapshot: no permit data found, skipping");
    return;
  }

  await db
    .insert(statsSnapshots)
    .values(
      rows.map((row) => ({
        snapshot_date: today,
        operator_id: row.operator_id,
        band_id: row.band_id,
        unique_stations_count: row.unique_stations_count,
        permits_count: row.permits_count,
      })),
    )
    .onConflictDoUpdate({
      target: [statsSnapshots.snapshot_date, statsSnapshots.operator_id, statsSnapshots.band_id],
      set: {
        unique_stations_count: sql`excluded.unique_stations_count`,
        permits_count: sql`excluded.permits_count`,
      },
    });

  logger.info(`Stats snapshot: saved ${rows.length} rows for ${today.toISOString().slice(0, 10)}`);
}
