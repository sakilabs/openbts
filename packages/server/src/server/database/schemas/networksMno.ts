import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

import { stations } from "./stations.js";

export const networks = pgTable("networks_data", {
	networks_id: serial("networks_id").primaryKey(),
	networks_name: text("networks_name"),
});

export const mnoData = pgTable("mno_data", {
	mno_internal_id: serial("mno_internal_id").primaryKey(),
	mno_id: integer("mno_id").notNull(),
	mno_name: text("mno_name"),
});

export const stationsNetworks = relations(networks, ({ one }) => ({
	networks: one(stations, {
		fields: [networks.networks_id],
		references: [stations.networks_id],
	}),
}));

export const stationsMno = relations(mnoData, ({ one }) => ({
	networks: one(stations, {
		fields: [mnoData.mno_internal_id],
		references: [stations.mno_id],
	}),
}));
