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
export const UKEPermissionType = pgEnum("uke_permission_type", ["zmP", "P"]);

export const operators = pgTable(
	"operators",
	{
		id: serial("id").primaryKey(),
		name: varchar("name", { length: 100 }).notNull().unique(),
		parent_id: integer("parent_id").references((): AnyPgColumn => operators.id, { onDelete: "set null", onUpdate: "cascade" }),
		mnc_code: integer("mnc_code").notNull(),
	},
	(table) => [index("operator_parent_id_idx").on(table.parent_id)],
);

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
	longitude: integer("longitude").notNull(),
	latitude: integer("latitude").notNull(),
});

export const stations = pgTable(
	"stations",
	{
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
	},
	(table) => [index("station_location_id_idx").on(table.location_id)],
);

export const ukePermissions = pgTable(
	"uke_permissions",
	{
		id: serial("id").primaryKey(),
		station_id: varchar("station_id", { length: 10 }).notNull(),
		operator_name: varchar("operator_name", { length: 255 }).notNull(),
		decision_number: varchar("decision_number", { length: 100 }),
		decision_type: UKEPermissionType("decision_type").notNull(),
		expiry_date: timestamp({ withTimezone: true }).notNull(),
		longitude: integer("longitude").notNull(),
		latitude: integer("latitude").notNull(),
		city: varchar("city", { length: 255 }).notNull(),
		location: text("location").notNull(),
		band_id: integer("band_id")
			.references(() => bands.id, { onDelete: "cascade", onUpdate: "cascade" })
			.notNull(),
		last_updated: timestamp({ withTimezone: true }).notNull().defaultNow(),
		date_created: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("uke_permissions_station_id_idx").on(table.station_id)],
);

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
	last_login: timestamp({ withTimezone: true }),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
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
	scope: text("scope").$type<string>().notNull().default(""),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
	updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const userLists = pgTable("user_lists", {
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

export const stationNotes = pgTable(
	"station_comments",
	{
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
	},
	(table) => [index("station_comments_station_id_idx").on(table.station_id), index("station_comments_user_id_idx").on(table.user_id)],
);

export const attachments = pgTable(
	"attachments",
	{
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
	},
	(table) => [index("attachment_author_id_idx").on(table.author_id)],
);

export const siteConfig = pgTable("site_config", {
	id: serial("id").primaryKey(),
	key: varchar("key", { length: 100 }).notNull().unique(),
	value: text("value").notNull(),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
	updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const TypeEnum = pgEnum("type", ["new", "update"]);
export const submissions = pgTable(
	"submissions",
	{
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
	},
	(table) => [
		index("submission_station_id_idx").on(table.station_id),
		index("submission_submitter_id_idx").on(table.submitter_id),
		index("submission_reviewer_id_idx").on(table.reviewer_id),
	],
);

export const AuditLogAction = pgEnum("audit_log_action", ["create", "update", "delete"]);

export const auditLogs = pgTable(
	"audit_logs",
	{
		id: serial("id").primaryKey(),
		action: AuditLogAction("action").notNull(),
		record_id: integer("record_id").notNull(),
		old_values: jsonb("old_values"),
		new_values: jsonb("new_values"),
		user_id: integer("user_id").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
		created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("audit_logs_record_id_idx").on(table.record_id), index("audit_logs_user_id_idx").on(table.user_id)],
);
