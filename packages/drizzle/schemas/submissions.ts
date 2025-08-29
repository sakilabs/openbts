import { boolean, check, doublePrecision, index, integer, pgEnum, pgSchema, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./auth.js";
import { bands, cells, locations, operators, ratEnum, regions, stations, StationStatus } from "./bts.js";
import { sql } from "drizzle-orm/sql";

export const SubmissionStatus = pgEnum("submission_status", ["pending", "approved", "rejected"]);
export const SubmissionTypeEnum = pgEnum("type", ["new", "update"]);
export const SubmissionsSchema = pgSchema("submissions");

/**
 * Submissions table
 * @example
 * { id: 1, station_id: 1, submitter_id: 1, status: "pending", type: "new", data: { station: { operator_id: 1, rnc: 0, enbi: 0, is_cdma: false, notes: "Test station" }, cells: [{ band: { value: 1800, name: "GSM1800", ua_freq: 1710, duplex: "FDD" }, config: { lac: 123, cid: 456 } }] }, reviewer_id: null, review_notes: null, createdAt: new Date(), updatedAt: new Date(), reviewed_at: null }
 */
export const submissions = SubmissionsSchema.table(
	"submissions",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		station_id: integer("station_id").references(() => stations.id, { onDelete: "cascade", onUpdate: "cascade" }),
		submitter_id: uuid("submitter_id")
			.references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" })
			.notNull(),
		status: SubmissionStatus("status").notNull().default("pending"),
		type: SubmissionTypeEnum("type").notNull().default("new"),
		reviewer_id: uuid("reviewer_id").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
		review_notes: text("review_notes"),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		reviewed_at: timestamp({ withTimezone: true }),
	},
	(table) => [
		index("submission_station_id_idx").on(table.station_id),
		index("submission_submitter_id_idx").on(table.submitter_id),
		index("submission_reviewer_id_idx").on(table.reviewer_id),
		index("submission_status_idx").on(table.status),
		index("submission_created_at_idx").on(table.createdAt),
	],
);

export const proposedCells = SubmissionsSchema.table(
	"proposed_cells",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		submission_id: integer("submission_id").references(() => submissions.id, { onDelete: "cascade", onUpdate: "cascade" }),
		target_cell_id: integer("target_cell_id").references(() => cells.id, { onDelete: "cascade", onUpdate: "cascade" }),
		station_id: integer("station_id").references(() => stations.id, { onDelete: "cascade", onUpdate: "cascade" }),
		band_id: integer("band_id").references(() => bands.id, { onDelete: "cascade", onUpdate: "cascade" }),
		rat: ratEnum("rat").notNull(),
		notes: text("notes"),
		is_confirmed: boolean("is_confirmed").default(false),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(t) => [
		index("proposed_cells_submission_id_idx").on(t.submission_id),
		unique("proposed_cells_unique").on(t.submission_id, t.station_id, t.band_id, t.rat),
	],
);

export const proposedGSMCells = SubmissionsSchema.table("proposed_gsm_cells", {
	proposed_cell_id: integer("proposed_cell_id")
		.primaryKey()
		.references(() => proposedCells.id, { onDelete: "cascade", onUpdate: "cascade" }),
	lac: integer("lac").notNull(),
	cid: integer("cid").notNull(),
});

export const proposedUMTSCells = SubmissionsSchema.table("proposed_umts_cells", {
	proposed_cell_id: integer("proposed_cell_id")
		.primaryKey()
		.references(() => proposedCells.id, { onDelete: "cascade", onUpdate: "cascade" }),
	lac: integer("lac"),
	carrier: integer("carrier"),
	rnc: integer("rnc").notNull(),
	cid: integer("cid").notNull(),
});

export const proposedLTECells = SubmissionsSchema.table(
	"proposed_lte_cells",
	{
		proposed_cell_id: integer("proposed_cell_id")
			.primaryKey()
			.references(() => proposedCells.id, { onDelete: "cascade", onUpdate: "cascade" }),
		tac: integer("tac"),
		enbid: integer("enbid").notNull(),
		clid: integer("clid").notNull(),
	},
	(t) => [check("clid_check", sql`${t.clid} BETWEEN 0 AND 255`)],
);

export const proposedNRCells = SubmissionsSchema.table("proposed_nr_cells", {
	proposed_cell_id: integer("proposed_cell_id")
		.primaryKey()
		.references(() => proposedCells.id, { onDelete: "cascade", onUpdate: "cascade" }),
	nrtac: integer("nrtac"),
	gnbid: integer("gnbid"),
	clid: integer("clid").notNull(),
	nci: integer("nci").unique(),
});

export const proposedStations = SubmissionsSchema.table(
	"proposed_stations",
	{
		id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
		submission_id: integer("submission_id").references(() => submissions.id, { onDelete: "cascade", onUpdate: "cascade" }),
		target_station_id: integer("target_station_id").references(() => stations.id, { onDelete: "set null", onUpdate: "cascade" }),
		station_id: varchar("station_id", { length: 16 }).notNull(),
		location_id: integer("location_id").references(() => locations.id, { onDelete: "set null", onUpdate: "cascade" }),
		operator_id: integer("operator_id").references(() => operators.id, { onDelete: "set null", onUpdate: "cascade" }),
		notes: text("notes"),
		updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		is_confirmed: boolean("is_confirmed").default(false),
		status: StationStatus("status").notNull().default("pending"),
	},
	(t) => [
		index("station_location_id_idx").on(t.location_id),
		unique("proposed_stations_submission_station_unique").on(t.submission_id, t.station_id),
	],
);

export const proposedLocations = SubmissionsSchema.table("proposed_locations", {
	id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
	submission_id: integer("submission_id").references(() => submissions.id, { onDelete: "cascade", onUpdate: "cascade" }),
	region_id: integer("region_id")
		.references(() => regions.id, { onDelete: "cascade", onUpdate: "cascade" })
		.notNull(),
	city: varchar("city", { length: 100 }),
	address: text("address"),
	longitude: doublePrecision("longitude").notNull(),
	latitude: doublePrecision("latitude").notNull(),
	updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
	createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
