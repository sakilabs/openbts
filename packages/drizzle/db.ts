import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { relations } from "./schemas/relations.ts";
import * as schema from "./schemas/index.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL environment variable is not set");
}

export const sql = postgres(connectionString, {
	prepare: false,
	max: 10,
	idle_timeout: 20,
	connect_timeout: 10,
});

export const db = drizzle({
	client: sql,
	schema,
	relations,
});

export type Database = typeof db;
export default db;
