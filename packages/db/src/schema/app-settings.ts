import { json, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Key-value config store for application-wide settings
export const appSettings = pgTable("app_settings", {
	key: text("key").primaryKey(),
	value: json("value").$type<unknown>().notNull(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export type AppSetting = typeof appSettings.$inferSelect;
