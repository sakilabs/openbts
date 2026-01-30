import { config } from "dotenv";
import { migrate } from "drizzle-orm/postgres-js/migrator";

config();

import { db, sql } from "./db.js";

async function main() {
	console.log("Running migrations...");

	await migrate(db, { migrationsFolder: "./migrations" });

	console.log("Migrations completed successfully");
	await sql.end();
	process.exit(0);
}

main().catch((err) => {
	console.error("Migration failed:", err);
	process.exit(1);
});
