import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schemas/index.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL environment variable is not set");
}

export const sql = postgres(connectionString, { idle_timeout: 20, max_lifetime: 60 * 30 });

export const db = drizzle({
	client: sql,
	schema,
});

export type Database = typeof db;
export default db;
