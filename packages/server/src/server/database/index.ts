import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schemas/index.js";

const postgresClient = postgres(process.env.DATABASE_URL as string);
export const db = drizzle({
	client: postgresClient,
	schema,
});

export type db = typeof db;

export default db;
