import type { ukePermissions } from "./schema.js";

export type UkePermission = typeof ukePermissions.$inferSelect;
export type NewUkePermission = typeof ukePermissions.$inferInsert;
