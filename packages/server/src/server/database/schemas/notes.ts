import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

import { stations } from "./stations.js";
import { userLists, users } from "./users.js";

export const systemNotes = pgTable("system_notes", {
	note_id: serial("note_id").primaryKey(),
	bts_id: integer("bts_id")
		.notNull()
		.references(() => stations.bts_id),
	note: text("note"),
});

export const userNotes = pgTable("comments", {
	comment_id: serial("comment_id").primaryKey(),
	bts_id: integer("bts_id")
		.notNull()
		.references(() => stations.bts_id),
	user_id: integer("user_id")
		.notNull()
		.references(() => users.user_id),
	comment: text("comment"),
	attachments: jsonb("attachments").$type<{ uuid: string; type: string }[]>(),
	created_at: timestamp("created_at").notNull(),
});

export const attachments = pgTable("attachments", {
	attachment_id: serial("attachment_id").primaryKey(),
	attachment_name: text("attachment_name").notNull(),
	attachment_uuid: text("attachment_uuid").notNull(),
	author_id: integer("author_id")
		.notNull()
		.references(() => users.user_id),
});

export const usersRelations = relations(users, ({ many }) => ({
	notes: many(userNotes),
	lists: many(userLists),
}));

export const userNotesRelations = relations(userNotes, ({ one }) => ({
	user: one(users, {
		fields: [userNotes.user_id],
		references: [users.user_id],
	}),
}));
