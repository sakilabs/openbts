import { integer, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

import { mnoData, networks } from "./networksMno.js";

export const stations = pgTable("stations", {
	bts_id: serial("bts_id").primaryKey(),
	owner: integer("owner").notNull(),
	networks_id: integer("networks_id").references(() => networks.networks_id),
	region: integer("region").notNull(),
	mno_id: integer("mno_id").references(() => mnoData.mno_internal_id),
	type: text("type").notNull(),
	longitude: varchar("longitude", { length: 9 }).notNull(),
	latitude: varchar("latitude", { length: 9 }).notNull(),
	location_type: text("location_type").notNull(),
});

export const stationsExtra = pgTable("stations_extra", {
	id: serial("id").primaryKey(),
	bts_id: integer("bts_id")
		.notNull()
		.references(() => stations.bts_id),
	city: text("city"),
	street: text("street"),
	street_number: text("street_number"),
	municipality: text("municipality"),
	district: text("district"),
	province: text("province"),
	cluster: integer("cluster"),
});

export const stationsRelations = relations(stations, ({ one }) => ({
	mno: one(mnoData),
	networks: one(networks),
}));
