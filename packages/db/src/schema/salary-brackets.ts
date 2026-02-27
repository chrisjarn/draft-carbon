import { json, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Salary range type used per state
export type SalaryRange = {
	min: number;
	max: number;
	mid?: number;
};

export const salaryBrackets = pgTable("salary_brackets", {
	id: text("id").primaryKey(),
	div: text("div").notNull(), // division e.g. "Accounting"
	sl: text("sl").notNull(), // service line
	prog: text("prog"), // programme / specialisation
	role: text("role").notNull(),
	nsw: json("nsw").$type<SalaryRange>().notNull().default({ min: 0, max: 0 }),
	qld: json("qld").$type<SalaryRange>().notNull().default({ min: 0, max: 0 }),
	sa: json("sa").$type<SalaryRange>().notNull().default({ min: 0, max: 0 }),
	vic: json("vic").$type<SalaryRange>().notNull().default({ min: 0, max: 0 }),
	wa: json("wa").$type<SalaryRange>().notNull().default({ min: 0, max: 0 }),
	bands: json("bands").$type<string[]>().notNull().default([]),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export type SalaryBracket = typeof salaryBrackets.$inferSelect;
export type NewSalaryBracket = typeof salaryBrackets.$inferInsert;
