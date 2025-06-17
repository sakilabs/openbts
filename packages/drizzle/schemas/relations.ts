import { relations } from "drizzle-orm/relations";

import {
	apiKeys,
	bands,
	cells,
	locations,
	operators,
	regions,
	stationComments,
	stations,
	userLists,
	users,
	attachments,
	ukePermits,
	radioLinesManufacturers,
	radioLinesAntennaTypes,
	radioLinesTransmitterTypes,
	ukeRadioLines,
	stationsPermits,
} from "./schema.js";

export const operatorRelations = relations(operators, ({ one, many }) => ({
	parent: one(operators, {
		fields: [operators.parent_id],
		references: [operators.id],
	}),
	children: many(operators),
	stations: many(stations),
}));

export const regionRelations = relations(regions, ({ many }) => ({
	locations: many(locations),
}));

export const locationRelations = relations(locations, ({ one, many }) => ({
	region: one(regions, {
		fields: [locations.region_id],
		references: [regions.id],
	}),
	stations: many(stations),
}));

export const stationRelations = relations(stations, ({ one, many }) => ({
	location: one(locations, {
		fields: [stations.location_id],
		references: [locations.id],
	}),
	operator: one(operators, {
		fields: [stations.operator_id],
		references: [operators.id],
	}),
	cells: many(cells),
}));

export const cellRelations = relations(cells, ({ one }) => ({
	station: one(stations, {
		fields: [cells.station_id],
		references: [stations.id],
	}),
	band: one(bands, {
		fields: [cells.band_id],
		references: [bands.id],
	}),
}));

export const bandRelations = relations(bands, ({ many }) => ({
	cells: many(cells),
}));

export const userListRelations = relations(userLists, ({ one }) => ({
	list: one(users, {
		fields: [userLists.created_by],
		references: [users.id],
	}),
}));

export const userNotesRelations = relations(stationComments, ({ one }) => ({
	user: one(users, {
		fields: [stationComments.user_id],
		references: [users.id],
	}),
	station: one(stations, {
		fields: [stationComments.station_id],
		references: [stations.id],
	}),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
	user: one(users, {
		fields: [apiKeys.user_id],
		references: [users.id],
	}),
}));

export const usersRelations = relations(users, ({ many }) => ({
	comments: many(stationComments),
	lists: many(userLists),
	apiKeys: many(apiKeys),
	attachments: many(attachments, {
		relationName: "author",
	}),
}));

export const attachmentRelations = relations(attachments, ({ one }) => ({
	author: one(users, {
		fields: [attachments.author_id],
		references: [users.id],
	}),
}));

export const manufacturerRelations = relations(radioLinesManufacturers, ({ many }) => ({
	radioLinesAntennaTypes: many(radioLinesAntennaTypes),
	radioLinestTansmitterTypes: many(radioLinesTransmitterTypes),
}));

export const antennaTypeRelations = relations(radioLinesAntennaTypes, ({ one }) => ({
	manufacturer: one(radioLinesManufacturers, {
		fields: [radioLinesAntennaTypes.manufacturer_id],
		references: [radioLinesManufacturers.id],
	}),
}));

export const transmitterTypeRelations = relations(radioLinesTransmitterTypes, ({ one }) => ({
	manufacturer: one(radioLinesManufacturers, {
		fields: [radioLinesTransmitterTypes.manufacturer_id],
		references: [radioLinesManufacturers.id],
	}),
}));

export const ukeRadioLineRelations = relations(ukeRadioLines, ({ one }) => ({
	txTransmitterType: one(radioLinesTransmitterTypes, {
		fields: [ukeRadioLines.tx_transmitter_type_id],
		references: [radioLinesTransmitterTypes.id],
	}),
	txAntennaType: one(radioLinesAntennaTypes, {
		fields: [ukeRadioLines.tx_antenna_type_id],
		references: [radioLinesAntennaTypes.id],
	}),
	rxAntennaType: one(radioLinesAntennaTypes, {
		fields: [ukeRadioLines.rx_antenna_type_id],
		references: [radioLinesAntennaTypes.id],
	}),
	operator: one(operators, {
		fields: [ukeRadioLines.operator_id],
		references: [operators.id],
	}),
}));

export const permitsRelations = relations(ukePermits, ({ one }) => ({
	band: one(bands, {
		fields: [ukePermits.band_id],
		references: [bands.id],
	}),
	operator: one(operators, {
		fields: [ukePermits.operator_id],
		references: [operators.id],
	}),
}));

export const stationsPermitsRelations = relations(stationsPermits, ({ one }) => ({
	permit: one(ukePermits, {
		fields: [stationsPermits.permit_id],
		references: [ukePermits.id],
	}),
	station: one(stations, {
		fields: [stationsPermits.station_id],
		references: [stations.id],
	}),
}));
