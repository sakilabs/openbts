import {
	type AnyPgColumn,
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const Role = pgEnum("role", ["user", "moderator", "admin"]);
export const APITokenTier = pgEnum("api_token_tier", ["basic", "pro", "unlimited"]);
export const SubmissionStatus = pgEnum("submission_status", ["pending", "approved", "rejected"]);

export const operators = pgTable("operators", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
	parent_id: integer("parent_id").references((): AnyPgColumn => operators.id, { onDelete: "set null", onUpdate: "cascade" }),
	mnc_code: integer("mnc_code").notNull(),
});
export const operatorMncCodeIdx = index("operator_mnc_code_idx").on(operators.mnc_code);

//* Provinces
export const regions = pgTable("regions", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
});

export const locations = pgTable("locations", {
	id: serial("id").primaryKey(),
	region_id: integer("region_id")
		.references(() => regions.id, { onDelete: "cascade", onUpdate: "cascade" })
		.notNull(),
	city: varchar("city", { length: 100 }).notNull(),
	address: text("address").notNull(),
	longitude: numeric("longitude", { precision: 9, scale: 6 }).notNull(),
	latitude: numeric("latitude", { precision: 8, scale: 6 }).notNull(),
});

export const stations = pgTable("stations", {
	id: serial("id").primaryKey(),
	station_id: varchar("station_id", { length: 9 }).notNull(),
	bts_id: integer("bts_id"),
	location_id: integer("location_id").references(() => locations.id, { onDelete: "set null", onUpdate: "cascade" }),
	operator_id: integer("operator_id").references(() => operators.id, { onDelete: "set null", onUpdate: "cascade" }),
	lac: integer("lac"),
	rnc: varchar("rnc", { length: 50 }),
	enbi: integer("enbi"),
	is_common_bch: boolean("is_common_bch").default(false),
	is_cdma: boolean("is_cdma").default(false),
	notes: text("notes"),
	last_updated: timestamp({ withTimezone: true }).notNull().defaultNow(),
	date_created: timestamp({ withTimezone: true }).notNull().defaultNow(),
	is_confirmed: boolean("is_confirmed").default(false),
	status: varchar("status", { length: 100 }),
});
export const stationIdIdx = index("station_station_id_idx").on(stations.station_id);

export const cells = pgTable("cells", {
	id: serial("id").primaryKey(),
	station_id: integer("station_id")
		.references(() => stations.id, { onDelete: "cascade", onUpdate: "cascade" })
		.notNull(),
	band_id: integer("band_id")
		.references(() => bands.id, { onDelete: "cascade", onUpdate: "cascade" })
		.notNull(),
	config: jsonb("config").notNull().$type<{ ecid: number; clid: number; carrier: number }>(),
	sector: integer("sector").notNull(),
	is_confimed: boolean("is_confirmed").default(false),
	last_updated: timestamp({ withTimezone: true }).notNull().defaultNow(),
	date_created: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const bands = pgTable("bands", {
	id: serial("id").primaryKey(),
	value: integer("value").unique(),
	name: varchar("name", { length: 10 }).notNull(),
	ua_freq: integer("ua_freq"),
	duplex: varchar("duplex", { length: 3 }),
});

export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	username: varchar("username", { length: 100 }).notNull().unique(),
	email: varchar("email", { length: 100 }).notNull().unique(),
	password: varchar("password").notNull(),
	role: Role("role").notNull().default("user"),
	is_active: boolean("is_active").default(true),
	last_login: timestamp({ withTimezone: true }),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
	updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const apiTokens = pgTable("api_tokens", {
	id: serial("id").primaryKey(),
	user_id: integer("user_id")
		.references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" })
		.notNull(),
	token: text("token").notNull().unique(),
	tier: APITokenTier("tier").notNull().default("basic"),
	expires_at: timestamp({ withTimezone: true }),
	last_used_at: timestamp({ withTimezone: true }),
	is_revoked: boolean("is_revoked").default(false),
	permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
	updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const userLists = pgTable("lists", {
	id: serial("id").primaryKey(),
	uuid: uuid("uuid").notNull().defaultRandom(),
	name: text("name").notNull(),
	description: text("description"),
	is_public: boolean("is_public").default(false),
	created_by: integer("created_by")
		.notNull()
		.references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
	stations: jsonb("stations").$type<number[]>().notNull(),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
	updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const stationNotes = pgTable("stations_notes", {
	id: serial("id").primaryKey(),
	station_id: integer("station_id")
		.references(() => stations.id, { onDelete: "cascade", onUpdate: "cascade" })
		.notNull(),
	user_id: integer("user_id")
		.references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" })
		.notNull(),
	attachments: jsonb("attachments").$type<{ uuid: string; type: string }[]>(),
	content: text("content").notNull(),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
	updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
export const stationNotesStationIdIdx = index("station_id_idx").on(stationNotes.station_id);
export const stationNotesUserIdIdx = index("user_id_idx").on(stationNotes.user_id);

export const attachments = pgTable("attachments", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	uuid: uuid("uuid").notNull().defaultRandom(),
	author_id: integer("author_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
	mime_type: varchar("mime_type", { length: 100 }).notNull(),
	size: integer("size").notNull(),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
	updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
export const attachmentUuidIdx = index("attachment_uuid_idx").on(attachments.uuid);

export const siteConfig = pgTable("site_config", {
	id: serial("id").primaryKey(),
	key: varchar("key", { length: 100 }).notNull().unique(),
	value: text("value").notNull(),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
	updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const TypeEnum = pgEnum("type", ["new", "update"]);
export const submissions = pgTable("submissions", {
	id: serial("id").primaryKey(),
	station_id: integer("station_id").references(() => stations.id, { onDelete: "cascade", onUpdate: "cascade" }),
	submitter_id: integer("submitter_id")
		.references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" })
		.notNull(),
	status: SubmissionStatus("status").notNull().default("pending"),
	type: TypeEnum("type").notNull(),
	data: jsonb("data").notNull().$type<{
		station?: {
			operator_id?: number;
			lac?: number;
			//* 3G only?
			rnc?: string;
			//* 3G only?
			enbi?: number;
			is_common_bch?: boolean;
			is_cdma?: boolean;
			is_umts?: boolean;
			is_gsm?: boolean;
			is_lte?: boolean;
			is_5g?: boolean;
			notes?: string;
		};
		cells?: {
			band: {
				value: number;
				name: string;
				ua_freq: number;
				duplex?: string;
			};
			config: {
				ecid: number;
				clid: number;
				carrier: number;
			};
			sector: number;
		}[];
	}>(),
	reviewer_id: integer("reviewer_id").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
	review_notes: text("review_notes"),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
	updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
	reviewed_at: timestamp({ withTimezone: true }),
});

export const submissionStatusIdx = index("submission_status_idx").on(submissions.status);
export const submissionStationIdx = index("submission_station_idx").on(submissions.station_id);
export const submissionSubmitterIdx = index("submission_submitter_idx").on(submissions.submitter_id);

export const AuditLogAction = pgEnum("audit_log_action", ["create", "update", "delete"]);

export const auditLogs = pgTable("audit_logs", {
	id: serial("id").primaryKey(),
	action: AuditLogAction("action").notNull(),
	record_id: integer("record_id").notNull(),
	old_values: jsonb("old_values"),
	new_values: jsonb("new_values"),
	user_id: integer("user_id").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const auditLogsRecordIdIdx = index("audit_logs_record_id_idx").on(auditLogs.record_id);
export const auditLogsUserIdIdx = index("audit_logs_user_id_idx").on(auditLogs.user_id);
