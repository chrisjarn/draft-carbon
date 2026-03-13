import {
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { carbonites } from "./carbonites";
import { entities } from "./entities";

// Headcount targets per entity per service line per financial year
export const headcountTargets = pgTable(
	"headcount_targets",
	{
		entityId: text("entity_id")
			.notNull()
			.references(() => entities.id, { onDelete: "cascade" }),
		slId: text("sl_id").notNull(),
		fy: text("fy").notNull().default("FY25-26"),
		target: integer("target").notNull().default(0),
		notes: text("notes"),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [primaryKey({ columns: [t.entityId, t.slId, t.fy] })],
);

// Attrition risk flags per staff member
export const attritionRisks = pgTable("attrition_risks", {
	id: text("id").primaryKey(),
	carboniteId: text("carbonite_id")
		.notNull()
		.references(() => carbonites.id, { onDelete: "cascade" }),
	riskLevel: text("risk_level").notNull().default("medium"), // low | medium | high
	reason: text("reason"),
	action: text("action"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Planning scenarios per entity per financial year
export const scenarios = pgTable("scenarios", {
	id: text("id").primaryKey(),
	entityId: text("entity_id")
		.notNull()
		.references(() => entities.id, { onDelete: "cascade" }),
	fy: text("fy").notNull().default("FY25-26"),
	name: text("name").notNull(),
	description: text("description"),
	color: text("color").default("#6366f1"),
	status: text("status").default("draft"), // draft | active
	createdAt: timestamp("created_at").defaultNow(),
});

// Roles within a scenario
export const scenarioRoles = pgTable("scenario_roles", {
	id: text("id").primaryKey(),
	scenarioId: text("scenario_id")
		.notNull()
		.references(() => scenarios.id, { onDelete: "cascade" }),
	roleTitle: text("role_title").notNull(),
	sl: text("sl"),
	salary: integer("salary").notNull().default(0),
	count: integer("count").notNull().default(1),
	employmentType: text("employment_type"), // FT | PT
	startMonth: text("start_month"), // Jan | Feb | ... | Dec
});

// Prior year comparison data
export const priorYearData = pgTable(
	"prior_year_data",
	{
		state: text("state").notNull(),
		office: text("office").notNull(),
		podName: text("pod_name").notNull(),
		year: text("year").notNull(), // e.g. "FY24-25"
		budget: integer("budget").default(0),
		headcount: integer("headcount").default(0),
	},
	(t) => [primaryKey({ columns: [t.state, t.office, t.podName, t.year] })],
);

export type HeadcountTarget = typeof headcountTargets.$inferSelect;
export type AttritionRisk = typeof attritionRisks.$inferSelect;
export type Scenario = typeof scenarios.$inferSelect;
export type ScenarioRole = typeof scenarioRoles.$inferSelect;
export type PriorYearData = typeof priorYearData.$inferSelect;
