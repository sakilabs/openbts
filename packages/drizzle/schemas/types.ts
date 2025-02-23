import type { InferModel } from 'drizzle-orm';
import { ukePermissions } from './schema.js';

export type UkePermission = InferModel<typeof ukePermissions>;
export type NewUkePermission = InferModel<typeof ukePermissions, 'insert'>; 