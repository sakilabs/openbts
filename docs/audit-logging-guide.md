# Audit Logging System Guide

This guide explains how to use the comprehensive audit logging system to track all changes and actions in the database.

## Overview

The audit logging system provides:

- Tracking of all database operations (create, update, delete, read)
- User authentication events (login, logout)
- Administrative actions
- Detailed metadata about each action
- IP address and user agent tracking
- Flexible integration options

## Schema

The audit logs schema has been enhanced to include:

```typescript
// Using a string field for action to support dot-notation action types
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    action: varchar("action", { length: 100 }).notNull(), // Using varchar for action types like 'user.login', 'station.create'
    table_name: varchar("table_name", { length: 100 }).notNull(),
    record_id: integer("record_id"),
    old_values: jsonb("old_values"),
    new_values: jsonb("new_values"),
    metadata: jsonb("metadata"),
    ip_address: varchar("ip_address", { length: 45 }),
    user_agent: text("user_agent"),
    invoked_by: integer("invoked_by").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  // Indexes for efficient querying
  (table) => [
    index("audit_logs_record_id_idx").on(table.record_id), 
    index("audit_logs_invoked_by_idx").on(table.invoked_by),
    index("audit_logs_table_name_idx").on(table.table_name),
    index("audit_logs_created_at_idx").on(table.created_at),
    index("audit_logs_action_idx").on(table.action) // Index for action field
  ],
);
```

## Integration Options

There are several ways to integrate audit logging into your application:

## Action Types

The audit logging system uses a structured dot-notation format for action types:

```typescript
export const ActionTypes = {
  // User actions
  USER_REGISTER: 'user.register',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  
  // Generic CRUD actions with type prefix
  CREATE: (type: string) => `${type}.create`,
  READ: (type: string) => `${type}.read`,
  UPDATE: (type: string) => `${type}.update`,
  DELETE: (type: string) => `${type}.delete`,
  
  // Other common actions
  EXPORT: (type: string) => `${type}.export`,
  IMPORT: (type: string) => `${type}.import`,
  APPROVE: (type: string) => `${type}.approve`,
  REJECT: (type: string) => `${type}.reject`,
  
  // For custom actions
  CUSTOM: (type: string, action: string) => `${type}.${action}`
};
```

This allows for more descriptive and structured action types like:

- `user.login` - User login action
- `station.create` - Creating a station
- `submission.approve` - Approving a submission

### 1. Fastify Plugin (Recommended for most routes)

The easiest way to add audit logging to all routes is to use the Fastify plugin:

```typescript
// In your server setup file
import auditLoggerPlugin from './plugins/auditLogger';

// Register the plugin
fastify.register(auditLoggerPlugin, {
  logAllRequests: true, // Set to false to only log non-GET requests
  excludeRoutes: ['/health', '/favicon.ico'] // Routes to exclude from logging
});
```

### 2. Direct Database Operations with Audit Logging

For more control over what gets logged, use the utility functions:

```typescript
import { createWithAudit, updateWithAudit, deleteWithAudit, queryWithAudit } from '@openbts/drizzle/src/utils/auditableActions';
import { stations } from '@openbts/drizzle';

// Create a new record with audit logging - uses 'stations.create' action type
const newStation = await createWithAudit(stations, {
  station_id: 'STATION123',
  // other fields...
}, {
  userId: req.user.id,
  request: req
});

// Update a record with audit logging - uses 'stations.update' action type
const updatedStation = await updateWithAudit(stations, 
  stationId, 
  { notes: 'Updated notes' },
  { userId: req.user.id, request: req }
);

// Delete a record with audit logging - uses 'stations.delete' action type
const deletedStation = await deleteWithAudit(stations,
  stationId,
  { userId: req.user.id, request: req }
);

// Query with audit logging - uses 'stations.read' action type
const stationsList = await queryWithAudit(
  () => db.query.stations.findMany(),
  stations,
  { 
    userId: req.user.id, 
    request: req,
    metadata: { filters: req.query }
  }
);
```

### 3. Low-level Audit Logging API

For custom audit logging needs, use the direct API:

```typescript
import { createAuditLog, logDataChange, logAuthEvent, logAdminAction } from '@openbts/drizzle/src/utils/auditLogger';

// Log a custom action using dot notation
await createAuditLog({
  action: ActionTypes.EXPORT('stations'),  // 'stations.export'
  tableName: 'stations',
  metadata: { format: 'csv', count: 250 },
  userId: req.user.id,
  request: req
});

// Log authentication events using predefined action types
await logAuthEvent({
  action: ActionTypes.USER_LOGIN,  // 'user.login'
  userId: user.id,
  metadata: { method: 'password' },
  request: req
});

// Log administrative actions using dot notation
await logAdminAction({
  action: ActionTypes.APPROVE('submission'),  // 'submission.approve'
  tableName: 'submissions',
  recordId: submissionId,
  metadata: { reason: 'All requirements met' },
  userId: req.user.id,
  request: req
});

// Log a completely custom action
await createAuditLog({
  action: ActionTypes.CUSTOM('user', 'password-reset'),  // 'user.password-reset'
  tableName: 'users',
  recordId: userId,
  metadata: { method: 'email' },
  userId: adminId,
  request: req
});
```

## Example Route with Audit Logging

Here's an example of how to modify an existing route to use audit logging:

```typescript
// Using queryWithAudit to wrap the database query
const ukePermitsRes = await queryWithAudit(
  async () => {
    return db.query.ukePermits.findMany({
      with: {
        band: true,
      },
      where: (_, { and, like, inArray, eq }) => {
        if (operator) conditions.push(like(ukePermits.operator_name, `%${operator}%`));
        if (bandIds && bandIds.length > 0) conditions.push(inArray(ukePermits.band_id, bandIds));
        if (decisionType) conditions.push(eq(ukePermits.decision_type, decisionType as "zmP" | "P"));

        return conditions.length > 0 ? and(...conditions) : undefined;
      },
      limit: limit ?? undefined,
      offset: offset,
    });
  },
  ukePermits,
  {
    userId: req.user?.id,
    request: req,
    metadata: {
      filters: {
        bounds,
        operator,
        band,
        decisionType,
        limit,
        page
      }
    }
  }
);
```

## Querying Audit Logs

To query the audit logs, you can use standard Drizzle ORM queries:

```typescript
import { auditLogs } from '@openbts/drizzle';
import { desc, and, eq, gte, lte } from 'drizzle-orm';

// Get recent audit logs for a specific table
const recentLogs = await db.select()
  .from(auditLogs)
  .where(eq(auditLogs.table_name, 'stations'))
  .orderBy(desc(auditLogs.created_at))
  .limit(100);
  
// Get logs for a specific action type using dot notation
const loginLogs = await db.select()
  .from(auditLogs)
  .where(eq(auditLogs.action, 'user.login'))
  .orderBy(desc(auditLogs.created_at))
  .limit(100);
  
// Get all create actions for a specific resource type
const stationCreateLogs = await db.select()
  .from(auditLogs)
  .where(eq(auditLogs.action, 'stations.create'))
  .orderBy(desc(auditLogs.created_at));

// Get audit logs for a specific record
const recordLogs = await db.select()
  .from(auditLogs)
  .where(and(
    eq(auditLogs.table_name, 'stations'),
    eq(auditLogs.record_id, stationId)
  ))
  .orderBy(desc(auditLogs.created_at));

// Get audit logs for a date range
const dateRangeLogs = await db.select()
  .from(auditLogs)
  .where(and(
    gte(auditLogs.created_at, startDate),
    lte(auditLogs.created_at, endDate)
  ))
  .orderBy(desc(auditLogs.created_at));

// Get audit logs for a specific user
const userLogs = await db.select()
  .from(auditLogs)
  .where(eq(auditLogs.invoked_by, userId))
  .orderBy(desc(auditLogs.created_at))
  .limit(100);
```

## Best Practices

1. **Be Selective**: Don't log everything. Focus on important operations that you need to track.

2. **Protect Sensitive Data**: Be careful not to log sensitive information like passwords or personal data.

3. **Use Metadata Wisely**: The `metadata` field is flexible - use it to store relevant contextual information.

4. **Index Management**: The schema includes indexes for common query patterns. Add more if needed.

5. **Log Rotation**: Implement a strategy to archive or delete old audit logs to manage database size.

6. **Performance Considerations**: Audit logging adds overhead. For high-volume operations, consider batching or async logging.

7. **Standardize Action Types**: Use the dot-notation format consistently. The first part should be the resource type (e.g., 'user', 'station') and the second part should be the action (e.g., 'create', 'login').

8. **Use ActionTypes Constants**: Always use the `ActionTypes` constants to ensure consistency in your action naming.

9. **Resource Type Naming**: Use singular form for resource types in action names (e.g., 'user.login' not 'users.login').

## Conclusion

This audit logging system provides a comprehensive solution for tracking all changes and actions in your application. By integrating it into your routes and database operations, you can maintain a detailed history of all activities for security, compliance, and debugging purposes.
