import { json, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// State salary range: m = market range, r = recommended range (each is [min, max] or null)
export type StateRange = {
	m: [number, number] | null;
	r: [number, number];
} | null;

// Band breakdown per performance level
export type SalaryBand = {
	perf: string;
	label: string;
	nsw: StateRange;
	qld: StateRange;
	sa: StateRange;
	vic: StateRange;
	wa: StateRange;
};

export const salaryBrackets = pgTable("salary_brackets", {
	id: text("id").primaryKey(),
	div: text("div").notNull(), // division e.g. "Accounting"
	sl: text("sl").notNull(), // service line
	prog: text("prog"), // programme / specialisation
	role: text("role").notNull(),
	nsw: json("nsw").$type<StateRange>(),
	qld: json("qld").$type<StateRange>(),
	sa: json("sa").$type<StateRange>(),
	vic: json("vic").$type<StateRange>(),
	wa: json("wa").$type<StateRange>(),
	bands: json("bands").$type<SalaryBand[]>().notNull().default([]),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export type SalaryBracket = typeof salaryBrackets.$inferSelect;
export type NewSalaryBracket = typeof salaryBrackets.$inferInsert;
