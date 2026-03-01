import {
	date,
	numeric,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { carbonites } from "./carbonites";
import { entities } from "./entities";

export const promoFlagEnum = pgEnum("promo_flag", ["yes", "maybe", "no"]);

// Per-staff WFP data (billing targets, performance, promotions)
export const wfpStaffMeta = pgTable("wfp_staff_meta", {
	cbId: text("cb_id")
		.primaryKey()
		.references(() => carbonites.id, { onDelete: "cascade" }),
	billingTarget: numeric("billing_target"),
	perfRating: text("perf_rating"), // e.g. "Exceeds", "Meets", "Below"
	promoFlag: promoFlagEnum("promo_flag").default("no"),
	promoEta: date("promo_eta", { mode: "string" }),
	staffRole: text("staff_role"), // display role override for WFP
	billingActual: numeric("billing_actual"),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Per-entity billing config (multiplier, FY)
export const wfpEntitySettings = pgTable("wfp_entity_settings", {
	entId: text("ent_id")
		.primaryKey()
		.references(() => entities.id, { onDelete: "cascade" }),
	billingMultiplier: numeric("billing_multiplier").default("3.5"),
	fy: text("fy").default("FY25-26"),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Revenue targets & actuals per entity per FY
export const wfpRevenue = pgTable(
	"wfp_revenue",
	{
		entId: text("ent_id")
			.notNull()
			.references(() => entities.id, { onDelete: "cascade" }),
		fy: text("fy").notNull(), // e.g. "FY25-26"
		target: numeric("target").default("0"),
		actual: numeric("actual").default("0"),
		updatedAt: timestamp("updated_at").defaultNow(),
	},
	(t) => [primaryKey({ columns: [t.entId, t.fy] })],
);

export type WfpStaffMeta = typeof wfpStaffMeta.$inferSelect;
export type WfpEntitySettings = typeof wfpEntitySettings.$inferSelect;
export type WfpRevenue = typeof wfpRevenue.$inferSelect;
