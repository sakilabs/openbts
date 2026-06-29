import { analyzerUsage } from "@openbts/drizzle";
import db from "@openbts/drizzle/db";
import { eq } from "drizzle-orm";

import { logger } from "../utils/logger.ts";

export async function recordAnalyzerUsage(): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const result = await db.select().from(analyzerUsage).where(eq(analyzerUsage.date, day));
  if (!result) {
    void db
      .insert(analyzerUsage)
      .values({ date: day, count: 1 })
      .catch((e) => logger.error("Failed to record analyzer usage", { error: e instanceof Error ? e.message : String(e) }));
  }

  void db
    .update(analyzerUsage)
    .set({ count: (result[0]?.count ?? 0) + 1 })
    .where(eq(analyzerUsage.date, day));
}
