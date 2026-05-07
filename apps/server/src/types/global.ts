import type db from "@openbts/drizzle/db";

export type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
