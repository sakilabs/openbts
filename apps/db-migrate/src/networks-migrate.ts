import dotenv from "dotenv";
import postgres from "postgres";
import { inArray } from "drizzle-orm";

import { extraIdentificators, stations } from "@openbts/drizzle";
import { db, sql as newSql } from "@openbts/drizzle/db";

dotenv.config();

const BATCH_SIZE = 2000;

interface OldStationRow {
  bts_id: number;
  owner: number;
  mno_id: number;
  networks_id: number;
  networks_name: string | null;
  mno_name: string | null;
}

const OWNER_TO_OPERATOR: Record<number, string> = {
  1: "Orange",
  2: "T-Mobile",
};

async function run() {
  const oldDbUrl = process.env.NETWORKS_DATABASE_URL;
  if (!oldDbUrl) {
    console.error("NETWORKS_DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const oldSql = postgres(oldDbUrl, { prepare: false, max: 5, idle_timeout: 30, connect_timeout: 10 });

  console.log("Fetching operator IDs from new database...");
  const operatorRows = await db.query.operators.findMany({
    where: { name: { in: ["T-Mobile", "Orange"] } },
  });
  const operatorNameToId = new Map<string, number>();
  for (const op of operatorRows) operatorNameToId.set(op.name, op.id);

  if (!operatorNameToId.has("T-Mobile") || !operatorNameToId.has("Orange")) {
    console.error("T-Mobile or Orange operator not found in new database");
    await oldSql.end();
    await newSql.end({ timeout: 5 });
    process.exit(1);
  }

  console.log("Loading all T-Mobile & Orange stations from new database into memory...");
  const orangeId = operatorNameToId.get("Orange")!;
  const tmobileId = operatorNameToId.get("T-Mobile")!;
  const allStations = await db
    .select({ id: stations.id, station_id: stations.station_id, operator_id: stations.operator_id })
    .from(stations)
    .where(inArray(stations.operator_id, [orangeId, tmobileId]));

  // key: "raw_station_id:operator_id" → new stations.id[]
  const stationLookup = new Map<string, number[]>();
  // key: raw numeric station_id → new stations.id[] (T- and O- prefixed variants, any operator)
  const variantLookup = new Map<string, number[]>();
  const addToMap = (map: Map<string, number[]>, key: string, id: number) => {
    const existing = map.get(key);
    if (existing) existing.push(id);
    else map.set(key, [id]);
  };
  for (const s of allStations) {
    addToMap(stationLookup, `${s.station_id}:${s.operator_id}`, s.id);
    const prefixMatch = s.station_id.match(/^[TO]-(.+)$/);
    if (prefixMatch?.[1]) {
      addToMap(stationLookup, `${prefixMatch[1]}:${s.operator_id}`, s.id);
      addToMap(variantLookup, prefixMatch[1], s.id);
    }
  }
  console.log(`Loaded ${allStations.length} stations into lookup map`);

  console.log("Querying old NetWorks database...");
  const oldRows = await oldSql<OldStationRow[]>`
    SELECT
      s.bts_id,
      s.owner,
      md.mno_id,
      s.networks_id,
      nd.networks_name,
      md.mno_name
    FROM stations s
    LEFT JOIN networks_data nd ON nd.networks_id = s.networks_id
    LEFT JOIN mno_data md ON md.mno_internal_id = s.mno_id
    WHERE s.networks_id IS NOT NULL
      AND s.owner IN (1, 2)
      AND md.mno_id IS NOT NULL
  `;

  console.log(`Fetched ${oldRows.length} rows from old database`);

  let inserted = 0;
  let skipped = 0;
  let notFound = 0;

  for (let i = 0; i < oldRows.length; i += BATCH_SIZE) {
    const batch = oldRows.slice(i, i + BATCH_SIZE);

    const values: { station_id: number; networks_id: number; networks_name: string | null; mno_name: string | null }[] = [];

    for (const row of batch) {
      const operatorName = OWNER_TO_OPERATOR[row.owner];
      if (!operatorName) {
        skipped++;
        continue;
      }
      const operatorId = operatorNameToId.get(operatorName)!;
      const key = `${row.mno_id}:${operatorId}`;
      const baseIds = stationLookup.get(key) ?? [];
      const variantIds = variantLookup.get(String(row.mno_id)) ?? [];
      const matchedIds = [...new Set([...baseIds, ...variantIds])];

      if (!matchedIds.length) {
        notFound++;
        continue;
      }

      for (const newStationId of matchedIds) {
        values.push({
          station_id: newStationId,
          networks_id: row.networks_id,
          networks_name: row.networks_name?.trim() || null,
          mno_name: row.mno_name?.trim() || null,
        });
      }
    }

    if (values.length) {
      // eslint-disable-next-line no-await-in-loop -- sequential batching is intentional for DB backpressure + progress logging
      const result = await db
        .insert(extraIdentificators)
        .values(values)
        .onConflictDoNothing({ target: [extraIdentificators.station_id, extraIdentificators.networks_id] })
        .returning({ id: extraIdentificators.id });
      inserted += result.length;
      skipped += values.length - result.length;
    }

    console.log(`Progress: ${Math.min(i + BATCH_SIZE, oldRows.length)}/${oldRows.length} (inserted: ${inserted}, not found: ${notFound})`);
  }

  console.log(`\nDone! Inserted: ${inserted}, Not found: ${notFound}, Skipped/conflicts: ${skipped}`);

  await oldSql.end();
  await newSql.end({ timeout: 5 });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
