import { json, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { officeEnum, stateEnum } from "./enums";

export const entities = pgTable("entities", {
	id: text("id").primaryKey(),
	biz: text("biz").notNull(),
	tan: text("tan"),
	officeId: officeEnum("office_id"),
	state: stateEnum("state"),
	phone: text("phone"),
	address: text("address"),
	email: text("email"),
	legalName: text("legal_name"),
	sl: json("sl").$type<string[]>().default([]),
	partners: json("partners").$type<string[]>().default([]),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
