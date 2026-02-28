import {
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const podBudgets = pgTable(
	"pod_budgets",
	{
		state: text("state").notNull(),
		office: text("office").notNull(),
		podName: text("pod_name").notNull(),
		budget: integer("budget").notNull().default(0),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [primaryKey({ columns: [t.state, t.office, t.podName] })],
);

export type PodBudget = typeof podBudgets.$inferSelect;
export type NewPodBudget = typeof podBudgets.$inferInsert;
