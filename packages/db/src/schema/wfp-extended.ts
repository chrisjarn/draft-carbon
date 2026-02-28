import {
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

// Headcount targets per entity per service line
export const headcountTargets = pgTable(
	"headcount_targets",
	{
		entityId: text("entity_id").notNull(),
		slId: text("sl_id").notNull(),
		target: integer("target").notNull().default(0),
		notes: text("notes"),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [primaryKey({ columns: [t.entityId, t.slId] })],
);

// Attrition risk flags per staff member
export const attritionRisks = pgTable("attrition_risks", {
	id: text("id").primaryKey(),
	carboniteId: text("carbonite_id").notNull(), // FK → carbonites.id
	riskLevel: text("risk_level").notNull().default("medium"), // low | medium | high
	reason: text("reason"),
	action: text("action"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Planning scenarios per entity
export const scenarios = pgTable("scenarios", {
	id: text("id").primaryKey(),
	entityId: text("entity_id").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	color: text("color").default("#6366f1"),
	createdAt: timestamp("created_at").defaultNow(),
});

// Roles within a scenario
export const scenarioRoles = pgTable("scenario_roles", {
	id: text("id").primaryKey(),
	scenarioId: text("scenario_id").notNull(), // FK → scenarios.id
	roleTitle: text("role_title").notNull(),
	sl: text("sl"),
	salary: integer("salary").notNull().default(0),
	count: integer("count").notNull().default(1),
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
