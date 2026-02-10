import {
	type AnyPgColumn,
	bigint,
	boolean,
	check,
	doublePrecision,
	geometry,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	varchar,
} from "drizzle-orm/pg-core";
import { type SQL, sql } from "drizzle-orm";

export const UKEPermissionType = pgEnum("uke_permission_type", ["zmP", "P"]);
export const DuplexType = pgEnum("duplex", ["FDD", "TDD"]);
export const ratEnum = pgEnum("rat", ["GSM", "CDMA", "UMTS", "LTE", "NR", "IOT"]);
export const BandVariant = pgEnum("band_variant", ["commercial", "railway"]);
export const StationStatus = pgEnum("station_status", ["published", "inactive", "pending"]);

/**
 * Operator table
 * @example
 * { id: 1, name: "NetWorkS!", full_name: "NetWorks Sp. z o.o.", parent_id: null, mnc_code: 26034 }
 * @example
 * { id: 2, name: "T-Mobile", full_name: "T-Mobile Polska Sp. z o.o.", parent_id: 1, mnc_code: 26002 }
 */
export const operators = pgTable(
	"operators",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		name: varchar("name", { length: 100 }).notNull().unique(),
		full_name: varchar("full_name", { length: 250 }).notNull(),
		parent_id: integer("parent_id").references((): AnyPgColumn => operators.id, { onDelete: "set null", onUpdate: "cascade" }),
		mnc: integer("mnc").unique(),
	},
	(table) => [index("operator_parent_id_idx").on(table.parent_id)],
);

/**
 * Regions table (Provinces)
 * @example
 * { id: 1, name: "Mazowieckie" }
 */
export const regions = pgTable("regions", {
	id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
	code: varchar("code", { length: 3 }).notNull().unique(),
});

/**
 * Locations table (GPS coordinates)
 * @example
 * { id: 1, region_id: 1, city: "Warsaw", address: "ul. Marszałkowska 1", longitude: 52.2297, latitude: 21.0122 }
 */
export const locations = pgTable(
	"locations",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		region_id: integer("region_id")
			.references(() => regions.id, { onDelete: "cascade", onUpdate: "cascade" })
			.notNull(),
		city: varchar("city", { length: 100 }),
		address: text("address"),
		longitude: doublePrecision("longitude").notNull(),
		latitude: doublePrecision("latitude").notNull(),
		point: geometry("point", { type: "point", mode: "xy", srid: 4326 })
			.notNull()
			.generatedAlwaysAs((): SQL => sql`ST_SetSRID(ST_MakePoint(${locations.longitude}, ${locations.latitude}), 4326)`),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		check("locations_latitude_range", sql`${t.latitude} BETWEEN -90 AND 90`),
		check("locations_longitude_range", sql`${t.longitude} BETWEEN -180 AND 180`),
		index("locations_region_id_idx").on(t.region_id),
		index("locations_point_gist").using("gist", t.point),
		unique("locations_lonlat_unique").on(t.longitude, t.latitude),
	],
);

/**
 * Locations table for UKE stations (GPS coordinates)
 * @example
 * { id: 1, region_id: 1, city: "Warsaw", address: "ul. Marszałkowska 1", longitude: 52.2297, latitude: 21.0122 }
 */
export const ukeLocations = pgTable(
	"uke_locations",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		region_id: integer("region_id")
			.references(() => regions.id, { onDelete: "cascade", onUpdate: "cascade" })
			.notNull(),
		city: varchar("city", { length: 100 }),
		address: text("address"),
		longitude: doublePrecision("longitude").notNull(),
		latitude: doublePrecision("latitude").notNull(),
		point: geometry("point", { type: "point", mode: "xy", srid: 4326 })
			.notNull()
			.generatedAlwaysAs((): SQL => sql`ST_SetSRID(ST_MakePoint(${ukeLocations.longitude}, ${ukeLocations.latitude}), 4326)`),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		check("uke_locations_latitude_range", sql`${t.latitude} BETWEEN -90 AND 90`),
		check("uke_locations_longitude_range", sql`${t.longitude} BETWEEN -180 AND 180`),
		index("uke_locations_region_id_idx").on(t.region_id),
		index("uke_locations_point_gist").using("gist", t.point),
		unique("uke_locations_lonlat_unique").on(t.longitude, t.latitude),
	],
);

/**
 * Stations table
 * @example
 * { id: 1, station_id: "1234567890123456", location_id: 1, operator_id: 1, notes: "Test station", updatedAt: new Date(), createdAt: new Date(), is_confirmed: false }
 */
export const stations = pgTable(
	"stations",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		station_id: varchar("station_id", { length: 16 }).notNull(),
		location_id: integer("location_id").references(() => locations.id, { onDelete: "set null", onUpdate: "cascade" }),
		operator_id: integer("operator_id").references(() => operators.id, { onDelete: "set null", onUpdate: "cascade" }),
		notes: text("notes"),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		is_confirmed: boolean("is_confirmed").default(false),
		status: StationStatus("status").notNull().default("pending"),
	},
	(table) => [
		index("station_location_id_idx").on(table.location_id),
		index("stations_operator_id_idx").on(table.operator_id),
		index("stations_operator_location_id_idx").on(table.operator_id, table.location_id, table.id),
		index("stations_station_id_trgm_idx").using("gin", sql`(${table.station_id}) gin_trgm_ops`),
		index("stations_station_id_idx").on(table.station_id),
		index("stations_updated_at_idx").on(table.updatedAt),
		index("stations_created_at_idx").on(table.createdAt),
		unique("stations_station_id_operator_unique").on(table.station_id, table.operator_id),
		check("stations_station_id_16_length", sql`${table.station_id} ~ '(^.{1,16}$)'`),
	],
);

/**
 * Stations permits table
 * @example
 * { id: 1, permit_id: 1, station_id: 1 }
 */
export const stationsPermits = pgTable(
	"stations_permits",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		permit_id: integer("permit_id").references(() => ukePermits.id, { onDelete: "cascade", onUpdate: "cascade" }),
		station_id: integer("station_id").references(() => stations.id, { onDelete: "cascade", onUpdate: "cascade" }),
	},
	(table) => [
		index("stations_permits_station_id_idx").on(table.station_id),
		unique("stations_permits_pair_unique").on(table.station_id, table.permit_id),
	],
);

export const networksIds = pgTable(
	"networks_ids",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		station_id: integer("station_id")
			.references(() => stations.id, { onDelete: "cascade", onUpdate: "cascade" })
			.notNull(),
		networks_id: varchar("networks_id", { length: 16 }).notNull(),
		networks_name: varchar("networks_name", { length: 50 }),
		//* Putting MNO name here because it comes from NetWorkS! database and will only be available for T-Mobile & Orange
		mno_name: varchar("mno_name", { length: 50 }),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [index("networks_ids_station_idx").on(t.station_id), unique("networks_ids_networks_id_unique").on(t.station_id, t.networks_id)],
);

/**
 * UKE permits table
 * @example
 * { id: 1, station_id: "1234567890123456", operator_id: 1, location_id: 1, decision_number: "123456", decision_type: "zmP", expiry_date: new Date(), band_id: 1, updatedAt: new Date(), createdAt: new Date() }
 */
export const ukePermits = pgTable(
	"uke_permits",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		station_id: varchar("station_id", { length: 16 }).notNull(),
		operator_id: integer("operator_id")
			.references(() => operators.id, { onDelete: "set null", onUpdate: "cascade" })
			.notNull(),
		location_id: integer("location_id")
			.references(() => ukeLocations.id, { onDelete: "set null", onUpdate: "cascade" })
			.notNull(),
		decision_number: varchar("decision_number", { length: 100 }).notNull(),
		decision_type: UKEPermissionType("decision_type").notNull(),
		expiry_date: timestamp({ withTimezone: true }).notNull(),
		band_id: integer("band_id")
			.references(() => bands.id, { onDelete: "cascade", onUpdate: "cascade" })
			.notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		unique("uke_permits_unique_permit").on(
			table.station_id,
			table.operator_id,
			table.location_id,
			table.band_id,
			table.decision_number,
			table.decision_type,
			table.expiry_date,
		),
		index("uke_permits_station_id_idx").on(table.station_id),
		index("uke_permits_location_id_idx").on(table.location_id),
		index("uke_permits_operator_id_idx").on(table.operator_id),
		index("uke_permits_band_id_idx").on(table.band_id),
		index("uke_permits_decision_type_idx").on(table.decision_type),
		index("uke_permits_decision_number_trgm_idx").using("gin", sql`(${table.decision_number}) gin_trgm_ops`),
		index("uke_permits_station_id_trgm_idx").using("gin", sql`(${table.station_id}) gin_trgm_ops`),
		index("uke_permits_operator_band_idx").on(table.operator_id, table.band_id),
		index("uke_permits_operator_location_idx").on(table.operator_id, table.location_id),
	],
);

/**
 * Cells table
 * @example
 * { id: 1, station_id: 1, band_id: 1, lac: 123, cid: 456, cid_long: 123456789, carrier: 1, is_confirmed: false, updatedAt: new Date(), createdAt: new Date() }
 */
export const cells = pgTable(
	"cells",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		station_id: integer("station_id")
			.references(() => stations.id, { onDelete: "cascade", onUpdate: "cascade" })
			.notNull(),
		band_id: integer("band_id")
			.references(() => bands.id, { onDelete: "cascade", onUpdate: "cascade" })
			.notNull(),
		rat: ratEnum("rat").notNull(),
		notes: text("notes"),
		is_confirmed: boolean("is_confirmed").default(false),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [index("cells_station_band_rat_idx").on(t.station_id, t.band_id, t.rat), index("cells_station_rat_idx").on(t.station_id, t.rat)],
);

export const gsmCells = pgTable(
	"gsm_cells",
	{
		cell_id: integer("cell_id")
			.primaryKey()
			.references(() => cells.id, { onDelete: "cascade", onUpdate: "cascade" })
			.notNull(),
		lac: integer("lac").notNull(),
		cid: integer("cid").notNull(),
		e_gsm: boolean("e_gsm").default(false),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		unique("gsm_cells_lac_cid_unique").on(t.cell_id, t.lac, t.cid),
		index("gsm_cells_cid_idx").on(t.cid),
		index("gsm_cells_cid_trgm_idx").using("gin", sql`(${t.cid}::text) gin_trgm_ops`),
	],
);

export const umtsCells = pgTable(
	"umts_cells",
	{
		cell_id: integer("cell_id")
			.primaryKey()
			.references(() => cells.id, { onDelete: "cascade", onUpdate: "cascade" })
			.notNull(),
		lac: integer("lac"),
		carrier: integer("carrier"),
		rnc: integer("rnc").notNull(),
		cid: integer("cid").notNull(),
		cid_long: integer("cid_long")
			.notNull()
			.generatedAlwaysAs((): SQL => sql`(${umtsCells.rnc} * 65536) + ${umtsCells.cid}`),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		unique("umts_cells_rnc_cid_unique").on(t.cell_id, t.rnc, t.cid),
		index("umts_cells_cid_idx").on(t.cid),
		index("umts_cells_cid_trgm_idx").using("gin", sql`(${t.cid}::text) gin_trgm_ops`),
		index("umts_cells_cid_long_trgm_idx").using("gin", sql`(${t.cid_long}::text) gin_trgm_ops`),
	],
);

export const lteCells = pgTable(
	"lte_cells",
	{
		cell_id: integer("cell_id")
			.primaryKey()
			.references(() => cells.id, { onDelete: "cascade", onUpdate: "cascade" })
			.notNull(),
		tac: integer("tac"),
		enbid: integer("enbid").notNull(),
		clid: integer("clid").notNull(),
		ecid: integer("ecid")
			.notNull()
			.generatedAlwaysAs((): SQL => sql`(${lteCells.enbid} * 256) + ${lteCells.clid}`),
		supports_nb_iot: boolean("supports_nb_iot").default(false),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		check("clid_check", sql`${t.clid} BETWEEN 0 AND 255`),
		unique("lte_cells_enbid_clid_unique").on(t.cell_id, t.enbid, t.clid),
		index("lte_cells_nb_iot_true_idx").on(t.enbid, t.clid).where(sql`${t.supports_nb_iot} = true`),
		index("lte_cells_enbid_trgm_idx").using("gin", sql`(${t.enbid}::text) gin_trgm_ops`),
		index("lte_cells_ecid_trgm_idx").using("gin", sql`(${t.ecid}::text) gin_trgm_ops`),
	],
);

export const nrCells = pgTable(
	"nr_cells",
	{
		cell_id: integer("cell_id")
			.primaryKey()
			.references(() => cells.id, { onDelete: "cascade", onUpdate: "cascade" })
			.notNull(),
		nrtac: integer("nrtac"),
		gnbid: integer("gnbid"),
		gnbid_length: integer("gnbid_length").default(24),
		clid: integer("clid"),
		nci: bigint("nci", { mode: "bigint" }).generatedAlwaysAs(
			(): SQL => sql`(${nrCells.gnbid}::bigint * power(2, 36 - ${nrCells.gnbid_length})::bigint) + ${nrCells.clid}::bigint`,
		),
		pci: integer("pci"),
		supports_nr_redcap: boolean("supports_nr_redcap").default(false),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		// unique("nr_cells_gnbid_clid_unique").on(t.gnbid, t.clid).nullsNotDistinct(),
		index("nr_cells_redcap_true_idx").on(t.gnbid, t.clid).where(sql`${t.supports_nr_redcap} = true`),
		index("nr_cells_gnbid_trgm_idx").using("gin", sql`(${t.gnbid}::text) gin_trgm_ops`),
		index("nr_cells_nci_trgm_idx").using("gin", sql`(${t.nci}::text) gin_trgm_ops`),
	],
);
/**
 * Bands table
 * @example
 * { id: 1, value: 1800, name: "GSM 1800", duplex: "FDD" }
 */
export const bands = pgTable(
	"bands",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		value: integer("value"),
		rat: ratEnum("rat").notNull(),
		name: varchar("name", { length: 15 }).notNull(),
		duplex: DuplexType("duplex"),
		variant: BandVariant("variant").notNull().default("commercial"),
	},
	(t) => [
		unique("bands_rat_value_unique").on(t.rat, t.value, t.duplex, t.variant).nullsNotDistinct(),
		unique("bands_name_unique").on(t.name),
		index("bands_value_idx").on(t.value),
	],
);

/**
 * radioLinesManufacturers table. For UKE radiolines table
 * @example
 * { id: 1, name: "Ericsson" }
 */
export const radioLinesManufacturers = pgTable("radiolines_manufacturers", {
	id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
});

/**
 * Antenna types table. For UKE radiolines table
 * @example
 * { id: 1, name: "Antenna Type 1", manufacturer_id: 1 }
 */
export const radioLinesAntennaTypes = pgTable("radiolines_antenna_types", {
	id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
	manufacturer_id: integer("manufacturer_id").references(() => radioLinesManufacturers.id, { onDelete: "set null", onUpdate: "cascade" }),
});

/**
 * Transmitter types table. For UKE radiolines table
 * @example
 * { id: 1, name: "Transmitter Type 1", manufacturer_id: 1 }
 */
export const radioLinesTransmitterTypes = pgTable("radiolines_transmitter_types", {
	id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
	name: varchar("name", { length: 100 }).notNull().unique(),
	manufacturer_id: integer("manufacturer_id").references(() => radioLinesManufacturers.id, { onDelete: "set null", onUpdate: "cascade" }),
});

export const ukeOperators = pgTable("uke_operators", {
	id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
	name: varchar("full_name", { length: 150 }).notNull(),
	full_name: varchar("name", { length: 250 }).notNull().unique(),
});

/**
 * UKE radiolines table
 */
export const ukeRadioLines = pgTable(
	"uke_radiolines",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		tx_longitude: doublePrecision("tx_longitude").notNull(),
		tx_latitude: doublePrecision("tx_latitude").notNull(),
		tx_height: doublePrecision("tx_height").notNull(),
		tx_city: varchar("tx_city", { length: 100 }),
		tx_province: varchar("tx_province", { length: 50 }),
		tx_street: varchar("tx_street", { length: 200 }),
		tx_location_description: text("tx_location_description"),
		rx_longitude: doublePrecision("rx_longitude").notNull(),
		rx_latitude: doublePrecision("rx_latitude").notNull(),
		rx_height: doublePrecision("rx_height").notNull(),
		rx_city: varchar("rx_city", { length: 100 }),
		rx_province: varchar("rx_province", { length: 50 }),
		rx_street: varchar("rx_street", { length: 200 }),
		rx_location_description: text("rx_location_description"),
		freq: integer("freq").notNull(),
		ch_num: integer("ch_num"),
		plan_symbol: varchar("plan_symbol", { length: 50 }),
		ch_width: doublePrecision("ch_width"),
		polarization: varchar("polarization", { length: 10 }),
		modulation_type: varchar("modulation_type", { length: 50 }),
		//* This has to be in text varchar because UKE does not follow their own schema and types some bandwith in e.g. `2x1000` etc. If the value only has a number, it will be treated as Mb/s.
		bandwidth: varchar("bandwidth", { length: 100 }),
		tx_eirp: doublePrecision("tx_eirp"),
		tx_antenna_attenuation: doublePrecision("tx_antenna_attenuation"),
		tx_transmitter_type_id: integer("tx_transmitter_type_id").references(() => radioLinesTransmitterTypes.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		tx_antenna_type_id: integer("tx_antenna_type_id").references(() => radioLinesAntennaTypes.id, { onDelete: "set null", onUpdate: "cascade" }),
		tx_antenna_gain: doublePrecision("tx_antenna_gain"),
		tx_antenna_height: doublePrecision("tx_antenna_height"),
		rx_antenna_type_id: integer("rx_antenna_type_id").references(() => radioLinesAntennaTypes.id, { onDelete: "set null", onUpdate: "cascade" }),
		rx_antenna_gain: doublePrecision("rx_antenna_gain"),
		rx_antenna_height: doublePrecision("rx_antenna_height"),
		rx_noise_figure: doublePrecision("rx_noise_figure"),
		rx_atpc_attenuation: doublePrecision("rx_atpc_attenuation"),
		operator_id: integer("operator_id").references(() => ukeOperators.id, { onDelete: "set null", onUpdate: "cascade" }),
		permit_number: varchar("permit_number", { length: 100 }).notNull(),
		decision_type: UKEPermissionType("decision_type").notNull(),
		issue_date: timestamp({ withTimezone: true }),
		expiry_date: timestamp({ withTimezone: true }).notNull(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("uke_radiolines_operator_id_idx").on(table.operator_id),
		index("uke_radiolines_permit_number_idx").on(table.permit_number),
		index("uke_radiolines_permit_number_trgm_idx").using("gin", sql`(${table.permit_number}) gin_trgm_ops`),
		index("uke_radiolines_tx_point_gist").using("gist", sql`(ST_SetSRID(ST_MakePoint(${table.tx_longitude}, ${table.tx_latitude}), 4326))`),
		index("uke_radiolines_rx_point_gist").using("gist", sql`(ST_SetSRID(ST_MakePoint(${table.rx_longitude}, ${table.rx_latitude}), 4326))`),
	],
);

/**
 * UKE import metadata table
 * @example
 * { id: 1, import_type: "stations", file_list: ["https://uke.gov.pl/file1.xlsx", "https://uke.gov.pl/file2.xlsx"], last_import_date: new Date(), status: "success" }
 */
export const ukeImportMetadata = pgTable("uke_import_metadata", {
	id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
	import_type: varchar("import_type", { length: 20 }).notNull(),
	file_list: text("file_list").notNull(),
	last_import_date: timestamp({ withTimezone: true }).notNull().defaultNow(),
	status: varchar("status", { length: 20 }).notNull(),
});
