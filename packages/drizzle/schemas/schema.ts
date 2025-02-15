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

// temp
export const Role = pgEnum("role", ["user", "moderator", "admin"]);

// for rate limits?
export const APITokenTier = pgEnum("api_token_tier", ["basic", "pro", "unlimited"]);

export const operators = pgTable("operators", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
	parent_id: integer("parent_id").references((): AnyPgColumn => operators.id, { onDelete: "set null", onUpdate: "cascade" }),
	mnc_code: integer("mnc_code").notNull(),
});
export const operatorMncCodeIdx = index("operator_mnc_code_idx").on(operators.mnc_code);

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
	is_umts: boolean("is_umts").default(false),
	is_gsm: boolean("is_gsm").default(false),
	is_lte: boolean("is_lte").default(false),
	is_5g: boolean("is_5g").default(false),
	notes: text("notes"),
	last_updated: timestamp({ withTimezone: true }).notNull().defaultNow(),
	date_created: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
export const stationIdIdx = index("station_station_id_idx").on(stations.station_id);

export const cells = pgTable("cells", {
	id: serial("id").primaryKey(),
	station_id: integer("station_id")
		.references(() => stations.id, { onDelete: "cascade", onUpdate: "cascade" })
		.notNull(),
	standard: varchar("standard", { length: 20 }).notNull(),
	band_id: integer("band_id")
		.references(() => bands.id, { onDelete: "cascade", onUpdate: "cascade" })
		.notNull(),
	config: jsonb("config").notNull().$type<{ duplex: string | null; ecid: number; clid: number; carrier: number }>(),
	sector: integer("sector").notNull(),
	last_updated: timestamp({ withTimezone: true }).notNull().defaultNow(),
	date_created: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const bands = pgTable("bands", {
	id: serial("id").primaryKey(),
	value: integer("value").unique(),
	name: varchar("name", { length: 50 }).notNull(),
	frequency: varchar("frequency", { length: 50 }),
	duplex: varchar("duplex", { length: 5 }),
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
	deleted_at: timestamp({ withTimezone: true }),
});

export const apiTokens = pgTable("api_tokens", {
	id: serial("id").primaryKey(),
	user_id: integer("user_id")
		.references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" })
		.notNull(),
	token: text("token").notNull().unique(),
	name: varchar("name", { length: 100 }).notNull(),
	description: text("description"),
	tier: APITokenTier("tier").notNull().default("basic"),
	expires_at: timestamp({ withTimezone: true }),
	last_used_at: timestamp({ withTimezone: true }),
	is_revoked: boolean("is_revoked").default(false),
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
	deleted_at: timestamp({ withTimezone: true }),
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
