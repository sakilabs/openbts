import db from "../database/psql.js";
import { auditLogs, type AuditAction, type AuditSource } from "@openbts/drizzle";

import type { Database } from "../database/psql.js";
import type { FastifyRequest } from "fastify/types/request.js";

type AuditActionType = (typeof AuditAction.enumValues)[number];
type AuditSourceType = (typeof AuditSource.enumValues)[number];

export interface AuditLogEntry {
  action: AuditActionType;
  table_name: string;
  record_id?: number | null;
  old_values?: unknown;
  new_values?: unknown;
  metadata?: unknown;
  source?: AuditSourceType;
}

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export async function createAuditLog(entry: AuditLogEntry, req: FastifyRequest, tx?: Database | Transaction) {
  const handle = tx ?? db;
  const userId = req.userSession?.user?.id ?? null;

  await handle.insert(auditLogs).values({
    action: entry.action,
    table_name: entry.table_name,
    record_id: entry.record_id ?? null,
    old_values: entry.old_values ?? null,
    new_values: entry.new_values ?? null,
    metadata: entry.metadata ?? null,
    source: entry.source ?? "api",
    ip_address: req.ip ?? null,
    user_agent: req.headers["user-agent"] ?? null,
    invoked_by: userId,
  });
}
