import { importStations, associateStationsWithPermits } from "./stations.js";
import { importRadiolines } from "./radiolines.js";
import { importPermitDevices } from "./device-registry.ts";
import { cleanupDownloads } from "./utils.js";
import { sql } from "@openbts/drizzle/db";

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
