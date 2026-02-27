import { json, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const entities = pgTable("entities", {
	id: text("id").primaryKey(),
	biz: text("biz").notNull(),
	tan: text("tan"),
	officeId: text("office_id"),
	state: text("state"),
	phone: text("phone"),
	address: text("address"),
	email: text("email"),
	sl: json("sl").$type<string[]>().default([]),
	partners: json("partners").$type<string[]>().default([]),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
