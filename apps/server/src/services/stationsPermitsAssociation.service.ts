import { stationsPermits } from "@openbts/drizzle";
import db from "../database/psql.js";
import { associateStationsWithPermits } from "@openbts/uke-importer/stations";

export async function pruneStationsPermits(): Promise<void> {
  await db.delete(stationsPermits);
}

export async function rebuildStationsPermitsAssociations(): Promise<void> {
  await pruneStationsPermits();
  await associateStationsWithPermits();
}
