import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@openbts/drizzle";

const connectionString = process.env.DATABASE_URL;
const postgresClient = postgres(connectionString);
export const db = drizzle({
	client: postgresClient,
	schema,
});
export type db = typeof db;
export default db;
