import { stationsPermits, ukeLocations, ukePermits } from "@openbts/drizzle";
import db from "../database/psql.js";
import { associateStationsWithPermits } from "@openbts/uke-importer/stations";
import { eq, notExists } from "drizzle-orm/sql/expressions/conditions";

export async function pruneStationsPermits(): Promise<void> {
  await db.execute(`TRUNCATE TABLE ${stationsPermits} RESTART IDENTITY;`);
}

export async function rebuildStationsPermitsAssociations(): Promise<void> {
  await pruneStationsPermits();
  await associateStationsWithPermits();
}

export async function cleanupOrphanedUkeLocations(): Promise<void> {
  await db
    .delete(ukeLocations)
    .where(notExists(db.select({ id: ukePermits.id }).from(ukePermits).where(eq(ukePermits.location_id, ukeLocations.id))));
}
