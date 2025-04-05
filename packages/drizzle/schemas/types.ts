import type { ukePermits } from "./schema.js";

export type UkePermission = typeof ukePermits.$inferSelect;
export type NewUkePermission = typeof ukePermits.$inferInsert;
