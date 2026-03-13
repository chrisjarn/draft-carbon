import { db } from "@carbon-wfp/db";
import { carbonites } from "@carbon-wfp/db/schema/carbonites";
import { entities } from "@carbon-wfp/db/schema/entities";
import {
	attritionRisks,
	headcountTargets,
	scenarioRoles,
	scenarios,
} from "@carbon-wfp/db/schema/wfp-extended";
import { TRPCError } from "@trpc/server";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { detectAttritionRisks } from "../lib/calculations";
import {
	assertEntityScope,
	assertResourceScope,
	assertWriter,
	carboniteRoleWhere,
	entityRoleWhere,
	getRoleFilter,
} from "../lib/rbac";

export const wfpExtendedRouter = router({
	// ── Headcount targets ────────────────────────────────────────────────────────

	getHeadcountTargets: protectedProcedure
		.input(
			z.object({
				entityId: z.string(),
				fy: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			// Verify entity is in scope
			const rf = getRoleFilter(ctx.session.user);
			const entWhere = entityRoleWhere(rf);
			const [ent] = await db
				.select({ id: entities.id })
				.from(entities)
				.where(and(eq(entities.id, input.entityId), entWhere));
			if (!ent) throw new TRPCError({ code: "NOT_FOUND" });

			const filters = [eq(headcountTargets.entityId, input.entityId)];
			if (input.fy) {
				filters.push(eq(headcountTargets.fy, input.fy));
			}
			return db
				.select()
				.from(headcountTargets)
				.where(and(...filters))
				.orderBy(asc(headcountTargets.slId));
		}),

	upsertHeadcountTarget: protectedProcedure
		.input(
			z.object({
				entityId: z.string(),
				slId: z.string(),
				fy: z.string().default("FY25-26"),
				target: z.number().int().min(0),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			// Verify entity exists and is in scope
			const [ent] = await db
				.select()
				.from(entities)
				.where(eq(entities.id, input.entityId));
			if (!ent)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Entity not found: ${input.entityId}`,
				});
			assertEntityScope(ctx.session.user, {
				state: ent.state,
				sl: ent.sl,
			});
			const existing = await db
				.select()
				.from(headcountTargets)
				.where(
					and(
						eq(headcountTargets.entityId, input.entityId),
						eq(headcountTargets.slId, input.slId),
						eq(headcountTargets.fy, input.fy),
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
							eq(headcountTargets.fy, input.fy),
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
		.query(async ({ ctx, input }) => {
			const rf = getRoleFilter(ctx.session.user);
			const cbWhere = carboniteRoleWhere(rf);
			// SQL-level filter: only fetch risks for visible carbonites in entity
			const visibleStaffIds = db
				.select({ id: carbonites.id })
				.from(carbonites)
				.where(
					and(
						eq(carbonites.entity, input.entityId),
						eq(carbonites.isActive, true),
						cbWhere,
					),
				);

			const risks = await db
				.select()
				.from(attritionRisks)
				.where(inArray(attritionRisks.carboniteId, visibleStaffIds))
				.orderBy(asc(attritionRisks.createdAt));

			if (risks.length === 0) return [];

			// Enrich with computed score + factors from carbonite fields
			const carboniteIds = risks.map((r) => r.carboniteId);
			const cbRows = await db
				.select({
					id: carbonites.id,
					name: carbonites.name,
					isPartner: carbonites.isPartner,
					seniority: carbonites.seniority,
					salary: carbonites.salary,
				})
				.from(carbonites)
				.where(inArray(carbonites.id, carboniteIds));
			const cbMap = new Map(cbRows.map((c) => [c.id, c]));

			return risks.map((risk) => {
				const cb = cbMap.get(risk.carboniteId);
				if (!cb) return { ...risk, score: 0, factors: [] };
				const detected = detectAttritionRisks([
					{
						id: cb.id,
						name: cb.name ?? "Unknown",
						isPartner: cb.isPartner ?? false,
						seniority: cb.seniority,
						salary: cb.salary,
					},
				]);
				const { score, factors } = detected[0] ?? { score: 0, factors: [] };
				return { ...risk, score, factors };
			});
		}),

	getAllAttritionRisks: protectedProcedure.query(async ({ ctx }) => {
		const rf = getRoleFilter(ctx.session.user);
		const cbWhere = carboniteRoleWhere(rf);

		// If no role filter, return all risks; otherwise filter to visible carbonites
		const baseQuery = db.select().from(attritionRisks);
		const risks = await (cbWhere
			? baseQuery.where(
					inArray(
						attritionRisks.carboniteId,
						db
							.select({ id: carbonites.id })
							.from(carbonites)
							.where(and(eq(carbonites.isActive, true), cbWhere)),
					),
				)
			: baseQuery
		).orderBy(asc(attritionRisks.createdAt));

		if (risks.length === 0) return [];

		// Enrich with computed score + factors from carbonite fields
		const carboniteIds = risks.map((r) => r.carboniteId);
		const cbRows = await db
			.select({
				id: carbonites.id,
				name: carbonites.name,
				isPartner: carbonites.isPartner,
				seniority: carbonites.seniority,
				salary: carbonites.salary,
			})
			.from(carbonites)
			.where(inArray(carbonites.id, carboniteIds));
		const cbMap = new Map(cbRows.map((c) => [c.id, c]));

		return risks.map((risk) => {
			const cb = cbMap.get(risk.carboniteId);
			if (!cb) return { ...risk, score: 0, factors: [] };
			const detected = detectAttritionRisks([
				{
					id: cb.id,
					name: cb.name ?? "Unknown",
					isPartner: cb.isPartner ?? false,
					seniority: cb.seniority,
					salary: cb.salary,
				},
			]);
			const { score, factors } = detected[0] ?? { score: 0, factors: [] };
			return { ...risk, score, factors };
		});
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
			// Verify carbonite exists and is in scope
			const [cb] = await db
				.select({
					id: carbonites.id,
					state: carbonites.state,
					sl: carbonites.sl,
				})
				.from(carbonites)
				.where(eq(carbonites.id, input.carboniteId));
			if (!cb)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Carbonite not found: ${input.carboniteId}`,
				});
			assertResourceScope(ctx.session.user, {
				state: cb.state,
				sl: cb.sl,
			});
			const id = `ar-${crypto.randomUUID()}`;
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
			// Fetch the risk, then verify the linked carbonite is in scope
			const [risk] = await db
				.select()
				.from(attritionRisks)
				.where(eq(attritionRisks.id, input.id));
			if (!risk) throw new TRPCError({ code: "NOT_FOUND" });
			const [cb] = await db
				.select({
					id: carbonites.id,
					state: carbonites.state,
					sl: carbonites.sl,
				})
				.from(carbonites)
				.where(eq(carbonites.id, risk.carboniteId));
			if (cb) {
				assertResourceScope(ctx.session.user, {
					state: cb.state,
					sl: cb.sl,
				});
			}
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
			// Fetch the risk, then verify the linked carbonite is in scope
			const [risk] = await db
				.select()
				.from(attritionRisks)
				.where(eq(attritionRisks.id, input.id));
			if (!risk) throw new TRPCError({ code: "NOT_FOUND" });
			const [cb] = await db
				.select({
					id: carbonites.id,
					state: carbonites.state,
					sl: carbonites.sl,
				})
				.from(carbonites)
				.where(eq(carbonites.id, risk.carboniteId));
			if (cb) {
				assertResourceScope(ctx.session.user, {
					state: cb.state,
					sl: cb.sl,
				});
			}
			await db.delete(attritionRisks).where(eq(attritionRisks.id, input.id));
			return { deleted: input.id };
		}),

	// ── Scenarios ────────────────────────────────────────────────────────────────

	getScenarios: protectedProcedure
		.input(
			z.object({
				entityId: z.string(),
				fy: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			// Verify entity is in scope
			const rf = getRoleFilter(ctx.session.user);
			const entWhere = entityRoleWhere(rf);
			const [ent] = await db
				.select({ id: entities.id })
				.from(entities)
				.where(and(eq(entities.id, input.entityId), entWhere));
			if (!ent) throw new TRPCError({ code: "NOT_FOUND" });

			const filters = [eq(scenarios.entityId, input.entityId)];
			if (input.fy) {
				filters.push(eq(scenarios.fy, input.fy));
			}
			const scens = await db
				.select()
				.from(scenarios)
				.where(and(...filters))
				.orderBy(asc(scenarios.createdAt));

			// Only fetch roles for the scenarios we found, not the entire table
			const scenIds = scens.map((s) => s.id);
			const roles =
				scenIds.length > 0
					? await db
							.select()
							.from(scenarioRoles)
							.where(inArray(scenarioRoles.scenarioId, scenIds))
							.orderBy(asc(scenarioRoles.roleTitle))
					: [];

			const rolesMap = new Map<string, (typeof roles)[number][]>();
			for (const role of roles) {
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
				fy: z.string().default("FY25-26"),
				name: z.string().min(1),
				description: z.string().optional(),
				color: z.string().optional(),
				status: z.enum(["draft", "active"]).optional(),
				roles: z
					.array(
						z.object({
							roleTitle: z.string().min(1),
							sl: z.string().optional(),
							salary: z.number().int().min(0),
							count: z.number().int().min(1),
							employmentType: z.string().optional(),
							startMonth: z.string().optional(),
						}),
					)
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			// Verify entity exists and is in scope
			const [ent] = await db
				.select()
				.from(entities)
				.where(eq(entities.id, input.entityId));
			if (!ent)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Entity not found: ${input.entityId}`,
				});
			assertEntityScope(ctx.session.user, {
				state: ent.state,
				sl: ent.sl,
			});
			const id = `sc-${crypto.randomUUID()}`;
			const [scenario] = await db
				.insert(scenarios)
				.values({
					id,
					entityId: input.entityId,
					fy: input.fy,
					name: input.name,
					description: input.description,
					color: input.color,
				})
				.returning();

			if (input.roles?.length) {
				await db.insert(scenarioRoles).values(
					input.roles.map((r) => ({
						id: `sr-${crypto.randomUUID()}`,
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
			// Verify scenario's entity is in scope before deleting
			const [scen] = await db
				.select({ entityId: scenarios.entityId })
				.from(scenarios)
				.where(eq(scenarios.id, input.id));
			if (!scen) throw new TRPCError({ code: "NOT_FOUND" });
			const [ent] = await db
				.select()
				.from(entities)
				.where(eq(entities.id, scen.entityId));
			if (ent) {
				assertEntityScope(ctx.session.user, {
					state: ent.state,
					sl: ent.sl,
				});
			}
			// scenario_roles FK has onDelete: cascade — no manual cleanup needed
			await db.delete(scenarios).where(eq(scenarios.id, input.id));
			return { deleted: input.id };
		}),

	getScenario: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const [scen] = await db
				.select()
				.from(scenarios)
				.where(eq(scenarios.id, input.id));
			if (!scen) throw new TRPCError({ code: "NOT_FOUND" });
			const [ent] = await db
				.select()
				.from(entities)
				.where(eq(entities.id, scen.entityId));
			if (ent) {
				assertEntityScope(ctx.session.user, {
					state: ent.state,
					sl: ent.sl,
				});
			}
			const roles = await db
				.select()
				.from(scenarioRoles)
				.where(eq(scenarioRoles.scenarioId, input.id))
				.orderBy(asc(scenarioRoles.roleTitle));
			return { ...scen, roles };
		}),

	updateScenario: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				description: z.string().optional(),
				color: z.string().optional(),
				status: z.enum(["draft", "active"]).optional(),
				roles: z
					.array(
						z.object({
							roleTitle: z.string().min(1),
							sl: z.string().optional(),
							salary: z.number().int().min(0),
							count: z.number().int().min(1),
							employmentType: z.string().optional(),
							startMonth: z.string().optional(),
						}),
					)
					.optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			const [scen] = await db
				.select({ entityId: scenarios.entityId })
				.from(scenarios)
				.where(eq(scenarios.id, input.id));
			if (!scen) throw new TRPCError({ code: "NOT_FOUND" });
			const [ent] = await db
				.select()
				.from(entities)
				.where(eq(entities.id, scen.entityId));
			if (ent) {
				assertEntityScope(ctx.session.user, {
					state: ent.state,
					sl: ent.sl,
				});
			}
			const { id, roles, ...fields } = input;
			if (Object.keys(fields).length > 0) {
				await db.update(scenarios).set(fields).where(eq(scenarios.id, id));
			}
			if (roles !== undefined) {
				await db.delete(scenarioRoles).where(eq(scenarioRoles.scenarioId, id));
				if (roles.length > 0) {
					await db.insert(scenarioRoles).values(
						roles.map((r) => ({
							id: `sr-${crypto.randomUUID()}`,
							scenarioId: id,
							...r,
						})),
					);
				}
			}
			const [updated] = await db
				.select()
				.from(scenarios)
				.where(eq(scenarios.id, id));
			const updatedRoles = await db
				.select()
				.from(scenarioRoles)
				.where(eq(scenarioRoles.scenarioId, id))
				.orderBy(asc(scenarioRoles.roleTitle));
			return { ...updated, roles: updatedRoles };
		}),

	// ── Auto-detect attrition risks ─────────────────────────────────────────────

	autoDetectRisks: protectedProcedure
		.input(z.object({ entityId: z.string() }))
		.query(async ({ ctx, input }) => {
			const roleFilter = getRoleFilter(ctx.session.user);
			const where = carboniteRoleWhere(roleFilter);

			const staff = await db
				.select({
					id: carbonites.id,
					name: carbonites.name,
					isPartner: carbonites.isPartner,
					seniority: carbonites.seniority,
					salary: carbonites.salary,
				})
				.from(carbonites)
				.where(
					and(
						eq(carbonites.entity, input.entityId),
						eq(carbonites.isActive, true),
						where,
					),
				);

			// Get already-flagged risk IDs scoped to visible staff only
			const staffIds = staff.map((s) => s.id);
			const existingRisks =
				staffIds.length > 0
					? await db
							.select({ carboniteId: attritionRisks.carboniteId })
							.from(attritionRisks)
							.where(inArray(attritionRisks.carboniteId, staffIds))
					: [];
			const flaggedIds = new Set(existingRisks.map((r) => r.carboniteId));

			const candidates = staff.map((s) => ({
				id: s.id,
				name: s.name ?? "Unknown",
				isPartner: s.isPartner ?? false,
				seniority: s.seniority,
				salary: s.salary,
			}));

			const detected = detectAttritionRisks(candidates);

			// Exclude already-flagged staff
			return detected.filter((r) => !flaggedIds.has(r.carboniteId));
		}),

	// ── Firm-wide at-risk count (used by firmKPIs) ───────────────────────────────

	atRiskCount: protectedProcedure.query(async () => {
		const [row] = await db.select({ value: count() }).from(attritionRisks);
		return row?.value ?? 0;
	}),
});
