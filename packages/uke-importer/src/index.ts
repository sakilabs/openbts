import { importStations } from "./stations.js";
import { importRadiolines } from "./radiolines.js";
import { cleanupDownloads } from "./utils.js";
import { sql } from "@openbts/drizzle/db";

async function main(): Promise<void> {
	try {
		await importStations();
		await importRadiolines();
	} finally {
		await cleanupDownloads();
		await sql.end({ timeout: 5 });
	}
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
