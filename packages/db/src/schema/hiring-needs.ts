import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { carbonites } from "./carbonites";
import { officeEnum, slEnum, stateEnum } from "./enums";

export const hiringNeeds = pgTable("hiring_needs", {
	id: text("id").primaryKey(),
	role: text("role").notNull(),
	sl: slEnum("sl"),
	sg: text("sg"),
	state: stateEnum("state"),
	office: officeEnum("office"),
	location: text("location"),
	positions: integer("positions").default(1),
	type: text("type"), // FT | PT | Contract
	priority: text("priority"), // critical | high | medium | low
	status: text("status").default("open"), // open | closed
	salaryMin: integer("salary_min"),
	salaryMax: integer("salary_max"),
	targetStart: text("target_start"),
	approvedBy: text("approved_by"),
	managedBy: text("managed_by"),
	notes: text("notes"),
	closedHow: text("closed_how"), // hired | cancelled | deferred
	closedDate: text("closed_date"),
	closedName: text("closed_name"),
	hiredCarboniteId: text("hired_carbonite_id").references(() => carbonites.id, {
		onDelete: "set null",
	}),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export type HiringNeed = typeof hiringNeeds.$inferSelect;
export type NewHiringNeed = typeof hiringNeeds.$inferInsert;
