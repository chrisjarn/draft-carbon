import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const carbonites = pgTable("carbonites", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	role: text("role"),
	sl: text("sl"),
	sg: text("sg"),
	state: text("state"),
	office: text("office"),
	pod: text("pod"),
	salary: integer("salary").default(0),
	type: text("type").default("FT"), // FT | PT
	seniority: integer("seniority").default(5),
	location: text("location"),
	hours: integer("hours"),
	isPartner: boolean("is_partner").default(false),
	entity: text("entity"),
	reportsTo: text("reports_to"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export type Carbonite = typeof carbonites.$inferSelect;
export type NewCarbonite = typeof carbonites.$inferInsert;
