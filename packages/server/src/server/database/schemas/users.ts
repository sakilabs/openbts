import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

export const users = pgTable("users", {
	user_id: serial("user_id").primaryKey(),
	display_name: text("display_name").notNull(),
	username: text("username").notNull(),
	verified: boolean("verified").notNull(),
	password: text("password").notNull(),
});

export const userLists = pgTable("lists", {
	list_id: serial("list_id").primaryKey(),
	list_uuid: text("list_uuid"),
	created_by: integer("created_by")
		.notNull()
		.references(() => users.user_id),
	stations: jsonb("stations").$type<number[]>().notNull(),
	created_at: timestamp("created_at").notNull(),
	name: text("name").notNull(),
});

export const userListRelations = relations(userLists, ({ one }) => ({
	list: one(users, {
		fields: [userLists.created_by],
		references: [users.user_id],
	}),
}));
