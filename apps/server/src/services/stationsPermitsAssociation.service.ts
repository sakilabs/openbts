import { stationsPermits } from "@openbts/drizzle";
import db from "../database/psql.js";
import { sql } from "drizzle-orm";
import { associateStationsWithPermits } from "@openbts/uke-importer/stations";

export async function pruneStationsPermits(): Promise<void> {
  await db.execute(sql`TRUNCATE TABLE ${stationsPermits} RESTART IDENTITY;`);
}

export async function rebuildStationsPermitsAssociations(): Promise<void> {
  await pruneStationsPermits();
  await associateStationsWithPermits();
}
