import { refineCodecs } from "drizzle-orm/codecs";
import { textToDate, textToDateWithTz } from "drizzle-orm/pg-core/codecs";
import { drizzle } from "drizzle-orm/postgres-js";
import { postgresJsCodecs } from "drizzle-orm/postgres-js/codecs";
import postgres from "postgres";

import { relations } from "./schemas/relations.ts";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const sql = postgres(connectionString, {
  prepare: false,
  max: 10,
  idle_timeout: 100,
  connect_timeout: 10,
});

export const db = drizzle({
  client: sql,
  relations,
  jit: true,
  codecs: refineCodecs(postgresJsCodecs, {
    timestamp: { normalize: textToDate },
    timestamptz: { normalize: textToDateWithTz },
  }),
});

export type Database = typeof db;
export default db;
