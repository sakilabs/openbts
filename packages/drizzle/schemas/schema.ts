import {
	type AnyPgColumn,
	boolean,
	doublePrecision,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const Role = pgEnum("role", ["user", "moderator", "admin"]);
export const APITokenTier = pgEnum("api_token_tier", ["basic", "pro", "unlimited"]);
export const SubmissionStatus = pgEnum("submission_status", ["pending", "approved", "rejected"]);
export const UKEPermissionType = pgEnum("uke_permission_type", ["zmP", "P"]);
export const DuplexType = pgEnum("duplex", ["FDD", "TDD"]);
export const SubmissionTypeEnum = pgEnum("type", ["new", "update"]);

/**
 * Operator table
 * @example
 * { id: 1, name: "NetWorkS!", parent_id: null, mnc_code: 26034, is_visible: true }
 * @example
 * { id: 2, name: "T-Mobile", parent_id: 1, mnc_code: 26002, is_visible: true }
 */
export const operators = pgTable(
	"operators",
	{
		id: serial("id").primaryKey(),
		name: varchar("name", { length: 100 }).notNull().unique(),
		parent_id: integer("parent_id").references((): AnyPgColumn => operators.id, { onDelete: "set null", onUpdate: "cascade" }),
		mnc_code: integer("mnc_code").notNull(),
		//* We don't wanna show operators from radiolines (which are not real ISPs)
		is_visible: boolean("is_visible").default(false),
	},
	(table) => [index("operator_parent_id_idx").on(table.parent_id)],
);

/**
 * Regions table (Provinces)
 * @example
 * { id: 1, name: "Mazowieckie" }
 */
export const regions = pgTable("regions", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
});

/**
 * Locations table (Cities)
 * @example
 * { id: 1, region_id: 1, city: "Warsaw", address: "ul. Marszałkowska 1", longitude: 52.2297, latitude: 21.0122 }
 */
export const locations = pgTable("locations", {
	id: serial("id").primaryKey(),
	region_id: integer("region_id")
		.references(() => regions.id, { onDelete: "cascade", onUpdate: "cascade" })
		.notNull(),
	city: varchar("city", { length: 100 }).notNull(),
	address: text("address").notNull(),
	longitude: doublePrecision("longitude").notNull(),
	latitude: doublePrecision("latitude").notNull(),
});

/**
 * Stations table
 * @example
 * { id: 1, station_id: "1234567890123456", bts_id: 1, location_id: 1, operator_id: 1, rnc: 0, enbi: 0, is_cdma: false, notes: "Test station", last_updated: new Date(), date_created: new Date(), is_confirmed: false }
 */
export const stations = pgTable(
	"stations",
	{
		id: serial("id").primaryKey(),
		station_id: varchar("station_id", { length: 16 }).notNull(),
		bts_id: integer("bts_id"),
		location_id: integer("location_id").references(() => locations.id, { onDelete: "set null", onUpdate: "cascade" }),
		operator_id: integer("operator_id").references(() => operators.id, { onDelete: "set null", onUpdate: "cascade" }),
		rnc: integer("rnc").default(0),
		enbi: integer("enbi").default(0),
		is_cdma: boolean("is_cdma").default(false),
		notes: text("notes"),
		last_updated: timestamp({ withTimezone: true }).notNull().defaultNow(),
		date_created: timestamp({ withTimezone: true }).notNull().defaultNow(),
		is_confirmed: boolean("is_confirmed").default(false),
		status: varchar("status", { length: 100 }),
	},
	(table) => [index("station_location_id_idx").on(table.location_id)],
);

/**
 * Stations permits table
 * @example
 * { id: 1, permit_id: 1, station_id: 1 }
 */
export const stationsPermits = pgTable(
	"stations_permits",
	{
		id: serial("id").primaryKey(),
		permit_id: integer("permit_id").references(() => ukePermits.id, { onDelete: "cascade", onUpdate: "cascade" }),
		station_id: integer("station_id").references(() => stations.id, { onDelete: "cascade", onUpdate: "cascade" }),
	},
	(table) => [index("stations_with_permits_station_id_idx").on(table.station_id)],
);

/**
 * UKE permits table
 * @example
 * { id: 1, station_id: "1234567890123456", operator_id: 1, decision_number: "123456", decision_type: "zmP", expiry_date: new Date(), longitude: 52.2297, latitude: 21.0122, city: "Warsaw", location: "ul. Marszałkowska 1", band_id: 1, last_updated: new Date(), date_created: new Date() }
 */
export const ukePermits = pgTable(
	"uke_permits",
	{
		id: serial("id").primaryKey(),
		station_id: varchar("station_id", { length: 16 }).notNull(),
		operator_id: integer("operator_id")
			.references(() => operators.id, { onDelete: "set null", onUpdate: "cascade" })
			.notNull(),
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
	(table) => [index("uke_permits_station_id_idx").on(table.station_id)],
);

/**
 * Cells table
 * @example
 * { id: 1, station_id: 1, band_id: 1, config: { lac: 123, cid: 456 }, is_confirmed: false, last_updated: new Date(), date_created: new Date() }
 */
export const cells = pgTable("cells", {
	id: serial("id").primaryKey(),
	station_id: integer("station_id")
		.references(() => stations.id, { onDelete: "cascade", onUpdate: "cascade" })
		.notNull(),
	band_id: integer("band_id")
		.references(() => bands.id, { onDelete: "cascade", onUpdate: "cascade" })
		.notNull(),
	config: jsonb("config").notNull().$type<{ lac: number | null; cid: number | null }>(),
	is_confirmed: boolean("is_confirmed").default(false),
	last_updated: timestamp({ withTimezone: true }).notNull().defaultNow(),
	date_created: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/**
 * Bands table
 * @example
 * { id: 1, value: 1800, name: "GSM1800", ua_freq: 1710, duplex: "FDD" }
 */
export const bands = pgTable("bands", {
	id: serial("id").primaryKey(),
	value: integer("value").unique(),
	name: varchar("name", { length: 10 }).notNull(),
	ua_freq: integer("ua_freq"),
	duplex: DuplexType("duplex"),
});

export const users = pgTable(
	"users",
	{
		id: serial("id").primaryKey(),
		username: varchar("username", { length: 100 }).unique(),
		email: varchar("email", { length: 100 }).notNull().unique(),
		password: varchar("password", { length: 255 }),
		image: text("image"),
		name: text("name"),
		role: Role("role").notNull().default("user"),
		last_login: timestamp({ withTimezone: true }),
		emailVerified: timestamp({ withTimezone: true }),
		created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
		isAnonymous: boolean("isAnonymous").default(false),
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

// export const accounts = pgTable("accounts", {
// 	id: text("id").notNull().primaryKey(),
// 	userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
// 	providerType: text("provider_type").notNull(),
// 	providerId: text("provider_id").notNull(),
// 	providerAccountId: text("provider_account_id").notNull(),
// 	refreshToken: text("refresh_token"),
// 	accessToken: text("access_token"),
// 	expiresAt: timestamp({ withTimezone: true }),
// 	idToken: text("id_token"),
// 	scope: text("scope"),
// 	createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
// 	updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
// }, (table) => {
// 	return [
// 		index("accounts_user_id_idx").on(table.userId),
// 		index("accounts_provider_account_id_idx").on(table.providerAccountId),
// 	];
// });

// export const verificationTokens = pgTable("verification_tokens", {
// 	id: text("id").primaryKey().notNull(),
// 	identifier: text("identifier").notNull(),
// 	token: text("token").notNull().unique(),
// 	expires: timestamp({ withTimezone: true }).notNull(),
// 	createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
// });

export const apiKeys = pgTable(
	"api_keys",
	{
		id: text("id").primaryKey().notNull(),
		userId: integer("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		name: text("name").notNull(),
		key: text("key").notNull().unique(),
		enabled: boolean("enabled").default(true).notNull(),
		expiresAt: timestamp({ withTimezone: true }),
		metadata: jsonb("metadata"),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		permissions: jsonb("permissions"),
		remaining: integer("remaining"),
		refillAmount: integer("refill_amount"),
		refillInterval: integer("refill_interval"),
		lastRefillAt: timestamp({ withTimezone: true }),
		rateLimitEnabled: boolean("rate_limit_enabled").default(false),
		rateLimitTimeWindow: integer("rate_limit_time_window"),
		rateLimitMax: integer("rate_limit_max"),
	},
	(table) => [index("api_keys_user_id_idx").on(table.userId)],
);

/**
 * User lists table
 * @example
 * { id: 1, uuid: "12345678901234", name: "My List", description: "My List Description", is_public: false, created_by: 1, stations: [1, 2, 3], created_at: new Date(), updated_at: new Date() }
 */
export const userLists = pgTable(
	"user_lists",
	{
		id: serial("id").primaryKey(),
		uuid: text("uuid")
			.notNull()
			.$defaultFn(() => nanoid(14)),
		name: text("name").notNull(),
		description: text("description"),
		is_public: boolean("is_public").default(false),
		created_by: integer("created_by")
			.notNull()
			.references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
		stations: jsonb("stations").$type<number[]>().notNull(),
		created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("user_lists_id_idx").on(table.id)],
);

/**
 * Station notes table
 * @example
 * { id: 1, station_id: 1, user_id: 1, attachments: [{ uuid: "12345678901234", type: "image/jpeg" }], content: "My Note", created_at: new Date(), updated_at: new Date() }
 */
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

/**
 * Attachments table
 * @example
 * { id: 1, name: "myfile.jpg", uuid: "12345678901234", author_id: 1, mime_type: "image/jpeg", size: 123456, created_at: new Date(), updated_at: new Date() }
 */
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

/**
 * Submissions table
 * @example
 * { id: 1, station_id: 1, submitter_id: 1, status: "pending", type: "new", data: { station: { operator_id: 1, rnc: 0, enbi: 0, is_cdma: false, notes: "Test station" }, cells: [{ band: { value: 1800, name: "GSM1800", ua_freq: 1710, duplex: "FDD" }, config: { lac: 123, cid: 456 } }] }, reviewer_id: null, review_notes: null, created_at: new Date(), updated_at: new Date(), reviewed_at: null }
 */
export const submissions = pgTable(
	"submissions",
	{
		id: serial("id").primaryKey(),
		station_id: integer("station_id").references(() => stations.id, { onDelete: "cascade", onUpdate: "cascade" }),
		submitter_id: integer("submitter_id")
			.references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" })
			.notNull(),
		status: SubmissionStatus("status").notNull().default("pending"),
		type: SubmissionTypeEnum("type").notNull().default("new"),
		data: jsonb("data").notNull().$type<{
			station?: {
				operator_id?: number;
				//* 3G only
				rnc?: string;
				//* 3G only
				enbi?: number;
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
					lac: number | null;
					cid: number | null;
				};
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

/**
 * Audit logs table
 * @example
 * { id: 1, action: "stations.create", table_name: "stations", record_id: 1, old_values: {}, new_values: {}, metadata: {}, source: "api", ip_address: "127.0.0.1", user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36", invoked_by: 1, created_at: new Date() }
 */
export const auditLogs = pgTable(
	"audit_logs",
	{
		id: serial("id").primaryKey(),
		action: varchar("action", { length: 100 }).notNull(),
		table_name: varchar("table_name", { length: 100 }).notNull(),
		record_id: integer("record_id"),
		old_values: jsonb("old_values"),
		new_values: jsonb("new_values"),
		metadata: jsonb("metadata"),
		source: varchar("source", { length: 50 }),
		ip_address: varchar("ip_address", { length: 45 }),
		user_agent: text("user_agent"),
		invoked_by: integer("invoked_by").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
		created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("audit_logs_record_id_idx").on(table.record_id),
		index("audit_logs_invoked_by_idx").on(table.invoked_by),
		index("audit_logs_table_name_idx").on(table.table_name),
		index("audit_logs_created_at_idx").on(table.created_at),
		index("audit_logs_action_idx").on(table.action),
	],
);

/**
 * radioLinesManufacturers table. For UKE radiolines table
 * @example
 * { id: 1, name: "Ericsson" }
 */
export const radioLinesManufacturers = pgTable("radiolines_manufacturers", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
});

/**
 * Antenna types table. For UKE radiolines table
 * @example
 * { id: 1, name: "Antenna Type 1", manufacturer_id: 1 }
 */
export const radioLinesAntennaTypes = pgTable("radiolines_antenna_types", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
	manufacturer_id: integer("manufacturer_id").references(() => radioLinesManufacturers.id, { onDelete: "set null", onUpdate: "cascade" }),
});

/**
 * Transmitter types table. For UKE radiolines table
 * @example
 * { id: 1, name: "Transmitter Type 1", manufacturer_id: 1 }
 */
export const radioLinesTransmitterTypes = pgTable("radiolines_transmitter_types", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
	manufacturer_id: integer("manufacturer_id").references(() => radioLinesManufacturers.id, { onDelete: "set null", onUpdate: "cascade" }),
});

/**
 * UKE radiolines table
 * @example
 * { id: 1, tx_longitude: 52.2297, tx_latitude: 21.0122, tx_height: 100, rx_longitude: 52.2297, rx_latitude: 21.0122, rx_height: 50, freq: 1800, ch_num: 1, plan_symbol: "A", ch_width: 5, polarization: "H", modulation_type: "QPSK", bandwidth: "20", tx_eirp: 30, tx_antenna_attenuation: 10, tx_transmitter_type_id: 1, tx_antenna_type_id: 1, tx_antenna_gain: 15, tx_antenna_height: 100, rx_antenna_type_id: 1, rx_antenna_gain: 10, rx_antenna_height: 50, rx_noise_figure: 5, rx_atpc_attenuation: 3, operator_id: 1, permit_number: "123456", decision_type: "zmP", expiry_date: new Date(), last_updated: new Date(), date_created: new Date() }
 */
export const ukeRadioLines = pgTable(
	"uke_radiolines",
	{
		id: serial("id").primaryKey(),
		tx_longitude: doublePrecision("tx_longitude").notNull(),
		tx_latitude: doublePrecision("tx_latitude").notNull(),
		tx_height: integer("tx_height").notNull(),
		rx_longitude: doublePrecision("rx_longitude").notNull(),
		rx_latitude: doublePrecision("rx_latitude").notNull(),
		rx_height: integer("rx_height").notNull(),
		freq: integer("freq").notNull(),
		ch_num: integer("ch_num"),
		plan_symbol: varchar("plan_symbol", { length: 50 }),
		ch_width: integer("ch_width"),
		polarization: varchar("polarization", { length: 10 }),
		modulation_type: varchar("modulation_type", { length: 50 }),
		//* This has to be in text varchar because UKE does not follow their own schema and types some bandwith in e.g. `2x1000` etc. If the value only has a number, it will be treated as Mb/s.
		bandwidth: varchar("bandwidth", { length: 100 }),
		tx_eirp: integer("tx_eirp"),
		tx_antenna_attenuation: integer("tx_antenna_attenuation"),
		tx_transmitter_type_id: integer("tx_transmitter_type_id").references(() => radioLinesAntennaTypes.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		tx_antenna_type_id: integer("tx_antenna_type_id").references(() => radioLinesAntennaTypes.id, { onDelete: "set null", onUpdate: "cascade" }),
		tx_antenna_gain: integer("tx_antenna_gain"),
		tx_antenna_height: integer("tx_antenna_height"),
		rx_antenna_type_id: integer("rx_antenna_type_id").references(() => radioLinesAntennaTypes.id, { onDelete: "set null", onUpdate: "cascade" }),
		rx_antenna_gain: integer("rx_antenna_gain"),
		rx_antenna_height: integer("rx_antenna_height"),
		rx_noise_figure: integer("rx_noise_figure"),
		rx_atpc_attenuation: integer("rx_atpc_attenuation"),
		operator_id: integer("operator_id").references(() => operators.id, { onDelete: "set null", onUpdate: "cascade" }),
		permit_number: varchar("permit_number", { length: 100 }),
		decision_type: varchar("decision_type", { length: 10 }),
		expiry_date: timestamp({ withTimezone: true }).notNull(),
		last_updated: timestamp({ withTimezone: true }).notNull().defaultNow(),
		date_created: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		//index("uke_radiolines_operator_id_idx").on(table.operator_id),
		index("uke_radiolines_permit_number_idx").on(table.permit_number),
	],
);
