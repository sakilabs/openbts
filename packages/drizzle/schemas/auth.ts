import { boolean, check, index, integer, jsonb, pgEnum, pgSchema, pgTable, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { stations } from "./bts.ts";
import { sql } from "drizzle-orm/sql";

export const Role = pgEnum("role", ["user", "moderator", "admin"]);
export const APITokenTier = pgEnum("api_token_tier", ["basic", "pro", "unlimited"]);
export const AuthSchema = pgSchema("auth");

export const users = AuthSchema.table(
	"users",
	{
		id: uuid("id").primaryKey().default(sql`uuidv7()`).notNull(),
		username: varchar("username", { length: 25 }).unique(),
		displayUsername: varchar("displayUsername", { length: 25 }),
		email: varchar("email", { length: 100 }).notNull().unique(),
		image: text("image"),
		name: text("name").notNull(),
		role: text("role").notNull().default("user"),
		emailVerified: boolean("emailVerified").default(false).notNull(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		banned: boolean("banned").default(false),
		banReason: text("banReason"),
		banExpires: timestamp({ withTimezone: true }),
	},
	(table) => [index("users_id_idx").on(table.id), index("users_email_idx").on(table.email)],
);

// export const sessions = pgTable("sessions", {
// 	id: text("id").notNull().primaryKey(),
// 	userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
// 	expiresAt: timestamp({ withTimezone: true }).notNull(),
// 	createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
// 	sessionToken: text("session_token").notNull().unique(),
// 	fresh: boolean("fresh").default(true),
// 	userAgent: text("user_agent"),
// 	ip: text("ip"),
// 	lastActiveAt: timestamp({ withTimezone: true }),
// });

export const accounts = AuthSchema.table(
	"accounts",
	{
		id: uuid("id").primaryKey().default(sql`uuidv7()`).notNull(),
		userId: uuid("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		accountId: varchar("account_id", { length: 255 }).notNull(),
		providerId: text("provider_id").notNull(),
		refreshToken: text("refresh_token"),
		accessToken: text("access_token"),
		accessTokenExpiresAt: timestamp({ withTimezone: true }),
		refreshTokenExpiresAt: timestamp({ withTimezone: true }),
		expiresAt: timestamp({ withTimezone: true }),
		idToken: text("id_token"),
		scope: text("scope"),
		password: varchar("password", { length: 255 }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(table) => {
		return [index("accounts_user_id_idx").on(table.userId)];
	},
);

export const verificationTokens = AuthSchema.table("verification_tokens", {
	id: uuid("id").primaryKey().default(sql`uuidv7()`).notNull(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull().unique(),
	expiresAt: timestamp({ withTimezone: true }).notNull(),
	createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const apiKeys = AuthSchema.table(
	"apiKeys",
	{
		id: uuid("id").primaryKey().default(sql`uuidv7()`).notNull(),
		name: text("name"),
		start: text("start"),
		prefix: text("prefix"),
		key: text("key").notNull(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		refillInterval: integer("refill_interval"),
		refillAmount: integer("refill_amount"),
		lastRefillAt: timestamp("last_refill_at"),
		enabled: boolean("enabled").default(true),
		rateLimitEnabled: boolean("rate_limit_enabled").default(true),
		rateLimitTimeWindow: integer("rate_limit_time_window").default(86400000),
		rateLimitMax: integer("rate_limit_max").default(10),
		requestCount: integer("request_count").default(0),
		remaining: integer("remaining"),
		lastRequest: timestamp("last_request"),
		expiresAt: timestamp("expires_at"),
		createdAt: timestamp("created_at").notNull(),
		updatedAt: timestamp("updated_at").notNull(),
		permissions: text("permissions"),
		metadata: text("metadata").default('{"tier":"basic"}'),
	},
	(table) => [index("apikeys_key_idx").on(table.key), index("apikeys_userId_idx").on(table.userId)],
);

/**
 * Attachments table
 * @example
 * { id: 1, name: "myfile.jpg", uuid: "12345678901234", author_id: 1, mime_type: "image/jpeg", size: 123456, createdAt: new Date(), updatedAt: new Date() }
 */
export const attachments = pgTable(
	"attachments",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		name: text("name").notNull(),
		uuid: uuid("uuid").notNull().defaultRandom().unique(),
		author_id: uuid("author_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
		mime_type: varchar("mime_type", { length: 100 }).notNull(),
		size: integer("size").notNull(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("attachment_author_id_idx").on(table.author_id),
		index("attachments_created_at_idx").on(table.createdAt),
		check("attachments_size_nonneg", sql`${table.size} >= 0`),
		check("attachments_mime_format", sql`${table.mime_type} ~ '^[\\w.+-]+/[\\w.+-]+'`),
	],
);

/**
 * User lists table
 * @example
 * { id: 1, uuid: "12345678901234", name: "My List", description: "My List Description", is_public: false, created_by: 1, stations: [1, 2, 3], createdAt: new Date(), updatedAt: new Date() }
 */
export const userLists = pgTable(
	"user_lists",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		uuid: text("uuid")
			.notNull()
			.$defaultFn(() => nanoid(14))
			.unique(),
		name: text("name").notNull(),
		description: text("description"),
		is_public: boolean("is_public").default(false),
		created_by: uuid("created_by")
			.notNull()
			.references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
		stations: jsonb("stations").$type<number[]>().notNull(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index("user_lists_id_idx").on(t.id),
		index("user_lists_created_by_idx").on(t.created_by),
		index("user_lists_stations_gin").using("gin", t.stations),
		unique("user_lists_creator_name_unique").on(t.created_by, t.name),
		check("user_lists_stations_is_array", sql`jsonb_typeof(${t.stations}) = 'array'`),
	],
);

/**
 * Station comments table
 * @example
 * { id: 1, station_id: 1, user_id: 1, attachments: [{ uuid: "12345678901234", type: "image/jpeg" }], content: "My Note", createdAt: new Date(), updatedAt: new Date() }
 */
export const stationComments = pgTable(
	"station_comments",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		station_id: integer("station_id")
			.references(() => stations.id, { onDelete: "cascade", onUpdate: "cascade" })
			.notNull(),
		user_id: uuid("user_id")
			.references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" })
			.notNull(),
		attachments: jsonb("attachments").$type<{ uuid: string; type: string }[]>(),
		content: text("content").notNull(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index("station_comments_station_id_idx").on(t.station_id),
		index("station_comments_user_id_idx").on(t.user_id),
		index("station_comments_station_created_idx").on(t.station_id, t.createdAt),
		check("station_comments_content_len", sql`char_length(${t.content}) BETWEEN 1 AND 10000`),
	],
);

/**
 * Audit logs table
 * @example
 * { id: 1, action: "stations.create", table_name: "stations", record_id: 1, old_values: {}, new_values: {}, metadata: {}, source: "api", ip_address: "127.0.0.1", user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36", invoked_by: 1, createdAt: new Date() }
 */
export const auditLogs = pgTable(
	"audit_logs",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		action: varchar("action", { length: 100 }).notNull(),
		table_name: varchar("table_name", { length: 100 }).notNull(),
		record_id: integer("record_id"),
		old_values: jsonb("old_values"),
		new_values: jsonb("new_values"),
		metadata: jsonb("metadata"),
		source: varchar("source", { length: 50 }),
		ip_address: varchar("ip_address", { length: 60 }),
		user_agent: text("user_agent"),
		invoked_by: uuid("invoked_by").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("audit_logs_record_id_idx").on(table.record_id),
		index("audit_logs_invoked_by_idx").on(table.invoked_by),
		index("audit_logs_table_name_idx").on(table.table_name),
		index("audit_logs_date_created_idx").on(table.createdAt),
		index("audit_logs_action_idx").on(table.action),
	],
);
