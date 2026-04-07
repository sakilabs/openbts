import { sql } from "@openbts/drizzle/db";

import { importPermitDevices } from "./device-registry.ts";
import { importRadiolines } from "./radiolines.js";
import { associateStationsWithPermits, importStations } from "./stations.js";
import { cleanupDownloads } from "./utils.js";

async function main(): Promise<void> {
  try {
    const dateStart = new Date();
    console.log(`UKE Importer started at ${dateStart.toISOString()}`);
    await importStations();
    await importRadiolines();
    await importPermitDevices();
    await associateStationsWithPermits();
    const dateEnd = new Date();
    console.log(`UKE Importer finished at ${dateEnd.toISOString()}`);
    const duration = (dateEnd.getTime() - dateStart.getTime()) / 1000;
    console.log(`Total duration: ${duration.toFixed(2)} seconds`);
  } finally {
    await cleanupDownloads();
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
