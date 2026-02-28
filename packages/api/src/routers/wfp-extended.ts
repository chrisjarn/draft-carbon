import { db } from "@carbon-wfp/db";
import { carbonites } from "@carbon-wfp/db/schema/carbonites";
import {
	attritionRisks,
	headcountTargets,
	scenarioRoles,
	scenarios,
} from "@carbon-wfp/db/schema/wfp-extended";
import { TRPCError } from "@trpc/server";
import { and, asc, count, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { assertWriter } from "../lib/rbac";

export const wfpExtendedRouter = router({
	// ── Headcount targets ────────────────────────────────────────────────────────

	getHeadcountTargets: protectedProcedure
		.input(z.object({ entityId: z.string() }))
		.query(async ({ input }) => {
			return db
				.select()
				.from(headcountTargets)
				.where(eq(headcountTargets.entityId, input.entityId))
				.orderBy(asc(headcountTargets.slId));
		}),

	upsertHeadcountTarget: protectedProcedure
		.input(
			z.object({
				entityId: z.string(),
				slId: z.string(),
				target: z.number().int().min(0),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			const existing = await db
				.select()
				.from(headcountTargets)
				.where(
					and(
						eq(headcountTargets.entityId, input.entityId),
						eq(headcountTargets.slId, input.slId),
					),
				);
			if (existing.length > 0) {
				const [row] = await db
					.update(headcountTargets)
					.set({
						target: input.target,
						notes: input.notes,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(headcountTargets.entityId, input.entityId),
							eq(headcountTargets.slId, input.slId),
						),
					)
					.returning();
				return row;
			}
			const [row] = await db.insert(headcountTargets).values(input).returning();
			return row;
		}),

	// ── Attrition risks ──────────────────────────────────────────────────────────

	getAttritionRisks: protectedProcedure
		.input(z.object({ entityId: z.string() }))
		.query(async ({ input }) => {
			// Get all carbonites in entity, then join with risks
			const staff = await db
				.select({ id: carbonites.id })
				.from(carbonites)
				.where(eq(carbonites.entity, input.entityId));
			const staffIds = new Set(staff.map((s) => s.id));

			if (staffIds.size === 0) return [];

			const risks = await db
				.select()
				.from(attritionRisks)
				.orderBy(asc(attritionRisks.createdAt));

			return risks.filter((r) => staffIds.has(r.carboniteId));
		}),

	getAllAttritionRisks: protectedProcedure.query(async () => {
		return db
			.select()
			.from(attritionRisks)
			.orderBy(asc(attritionRisks.createdAt));
	}),

	createAttritionRisk: protectedProcedure
		.input(
			z.object({
				carboniteId: z.string(),
				riskLevel: z.enum(["low", "medium", "high"]),
				reason: z.string().optional(),
				action: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			const id = `ar${Date.now()}`;
			const [row] = await db
				.insert(attritionRisks)
				.values({ id, ...input })
				.returning();
			return row;
		}),

	updateAttritionRisk: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				riskLevel: z.enum(["low", "medium", "high"]).optional(),
				reason: z.string().optional(),
				action: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			const { id, ...fields } = input;
			const [row] = await db
				.update(attritionRisks)
				.set({ ...fields, updatedAt: new Date() })
				.where(eq(attritionRisks.id, id))
				.returning();
			if (!row) throw new TRPCError({ code: "NOT_FOUND" });
			return row;
		}),

	deleteAttritionRisk: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			await db.delete(attritionRisks).where(eq(attritionRisks.id, input.id));
			return { deleted: input.id };
		}),

	// ── Scenarios ────────────────────────────────────────────────────────────────

	getScenarios: protectedProcedure
		.input(z.object({ entityId: z.string() }))
		.query(async ({ input }) => {
			const scens = await db
				.select()
				.from(scenarios)
				.where(eq(scenarios.entityId, input.entityId))
				.orderBy(asc(scenarios.createdAt));

			const allRoles = await db
				.select()
				.from(scenarioRoles)
				.orderBy(asc(scenarioRoles.roleTitle));

			const rolesMap = new Map<string, (typeof allRoles)[number][]>();
			for (const role of allRoles) {
				const existing = rolesMap.get(role.scenarioId);
				if (existing) {
					existing.push(role);
				} else {
					rolesMap.set(role.scenarioId, [role]);
				}
			}

			return scens.map((s) => ({
				...s,
				roles: rolesMap.get(s.id) ?? [],
			}));
		}),

	createScenario: protectedProcedure
		.input(
			z.object({
				entityId: z.string(),
				name: z.string().min(1),
				description: z.string().optional(),
				color: z.string().optional(),
				roles: z
					.array(
						z.object({
							roleTitle: z.string().min(1),
							sl: z.string().optional(),
							salary: z.number().int().min(0),
							count: z.number().int().min(1),
						}),
					)
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			const id = `sc${Date.now()}`;
			const [scenario] = await db
				.insert(scenarios)
				.values({
					id,
					entityId: input.entityId,
					name: input.name,
					description: input.description,
					color: input.color,
				})
				.returning();

			if (input.roles?.length) {
				await db.insert(scenarioRoles).values(
					input.roles.map((r, i) => ({
						id: `sr${Date.now()}${i}`,
						scenarioId: id,
						...r,
					})),
				);
			}

			return scenario;
		}),

	deleteScenario: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			// Delete roles first, then scenario
			await db
				.delete(scenarioRoles)
				.where(eq(scenarioRoles.scenarioId, input.id));
			await db.delete(scenarios).where(eq(scenarios.id, input.id));
			return { deleted: input.id };
		}),

	// ── Firm-wide at-risk count (used by firmKPIs) ───────────────────────────────

	atRiskCount: protectedProcedure.query(async () => {
		const [row] = await db.select({ value: count() }).from(attritionRisks);
		return row?.value ?? 0;
	}),
});
