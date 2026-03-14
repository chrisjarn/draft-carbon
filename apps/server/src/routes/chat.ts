import { openai } from "@ai-sdk/openai";
import { auth } from "@carbon-wfp/auth";
import { db } from "@carbon-wfp/db";
import { carbonites } from "@carbon-wfp/db/schema/carbonites";
import { entities } from "@carbon-wfp/db/schema/entities";
import { hiringNeeds } from "@carbon-wfp/db/schema/hiring-needs";
import { podBudgets } from "@carbon-wfp/db/schema/pod-budgets";
import { salaryBrackets } from "@carbon-wfp/db/schema/salary-brackets";
import { wfpRevenue } from "@carbon-wfp/db/schema/wfp";
import {
	attritionRisks,
	scenarioRoles,
	scenarios,
} from "@carbon-wfp/db/schema/wfp-extended";
import {
	type RoleFilter,
	carboniteRoleWhere,
	entityRoleWhere,
	getRoleFilter,
	hiringRoleWhere,
} from "@carbon-wfp/api/lib/rbac";
// stepCountIs replaces maxSteps in AI SDK v6; toUIMessageStreamResponse replaces toDataStreamResponse
import { stepCountIs, streamText, tool } from "ai";
import { and, asc, avg, count, eq, inArray, sum } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

export const chatRoute = new Hono();

const SYSTEM_PROMPT = `You are a workforce planning assistant for Carbon Group, an Australian accounting firm.
You have access to the following data domains via tools:

- Staff ("carbonites"): name, role, service line (sl), state, office, pod, salary, type (FT/PT), seniority, isPartner
- Revenue: target & actual per entity per financial year (e.g. "FY25-26")
- Hiring pipeline: open roles with priority, salary range, state, office, status
- Salary brackets: min/max/mid per service line and progression level
- Attrition risks: risk level (low/medium/high), reason, action plan per staff member
- Pod budgets: budget per pod per state/office
- Scenarios: what-if hiring plans with roles, salaries, counts per entity

When asked about workforce data, use the appropriate tools to fetch live data before answering.
Be concise and precise. Format currency values as AUD. Use plain language suitable for business stakeholders.`;

// ── Tool factories that apply role-based filtering ────────────────────────────

function makeGetRevenueSummary(rf: RoleFilter) {
	const entWhere = entityRoleWhere(rf);
	return tool({
		description:
			"Get revenue target and actual amounts per entity for a given financial year.",
		inputSchema: z.object({
			fy: z.string().describe('Financial year, e.g. "FY25-26"'),
		}),
		execute: async ({ fy }) => {
			const ents = await db
				.select()
				.from(entities)
				.where(entWhere)
				.orderBy(asc(entities.state), asc(entities.biz));
			const entIds = ents.map((e) => e.id);
			const revenue =
				entIds.length > 0
					? await db
							.select()
							.from(wfpRevenue)
							.where(
								and(eq(wfpRevenue.fy, fy), inArray(wfpRevenue.entId, entIds)),
							)
					: [];
			const revenueMap = new Map(revenue.map((r) => [r.entId, r]));
			return ents.map((e) => ({
				id: e.id,
				biz: e.biz,
				state: e.state,
				revenue: revenueMap.get(e.id) ?? null,
			}));
		},
	});
}

function makeGetFirmKPIs(rf: RoleFilter) {
	const cbWhere = carboniteRoleWhere(rf);
	return tool({
		description:
			"Get firm-wide KPIs: headcount, total payroll, average salary, and at-risk staff count.",
		inputSchema: z.object({}),
		execute: async (_input: Record<never, never>) => {
			const visibleStaffIds = cbWhere
				? db
						.select({ id: carbonites.id })
						.from(carbonites)
						.where(and(eq(carbonites.isActive, true), cbWhere))
				: null;

			const [[row], [riskRow]] = await Promise.all([
				db
					.select({
						headcount: count(),
						totalPayroll: sum(carbonites.salary),
						avgSalary: avg(carbonites.salary),
					})
					.from(carbonites)
					.where(and(eq(carbonites.isActive, true), cbWhere)),
				visibleStaffIds
					? db
							.select({ value: count() })
							.from(attritionRisks)
							.where(inArray(attritionRisks.carboniteId, visibleStaffIds))
					: db.select({ value: count() }).from(attritionRisks),
			]);
			return {
				headcount: row?.headcount ?? 0,
				totalPayroll: Number(row?.totalPayroll ?? 0),
				avgSalary: Math.round(Number(row?.avgSalary ?? 0)),
				atRiskCount: riskRow?.value ?? 0,
			};
		},
	});
}

function makeGetHiringPipeline(rf: RoleFilter) {
	const hiringWhere = hiringRoleWhere(rf);
	return tool({
		description:
			"Get hiring pipeline rows filtered by status. Use status 'all' to see every role regardless of status.",
		inputSchema: z.object({
			status: z
				.enum(["open", "active", "offer", "closed", "all"])
				.optional()
				.describe("Filter by status. Defaults to 'open' if omitted."),
		}),
		execute: async ({ status }) => {
			const effectiveStatus = status ?? "open";
			const filters =
				effectiveStatus !== "all"
					? [eq(hiringNeeds.status, effectiveStatus)]
					: [];
			if (hiringWhere) filters.push(hiringWhere);
			return db
				.select()
				.from(hiringNeeds)
				.where(filters.length > 0 ? and(...filters) : undefined)
				.orderBy(asc(hiringNeeds.priority), asc(hiringNeeds.targetStart));
		},
	});
}

function makeGetAttritionRisks(rf: RoleFilter) {
	const cbWhere = carboniteRoleWhere(rf);
	return tool({
		description:
			"Get all attrition risk records enriched with staff name and risk details.",
		inputSchema: z.object({}),
		execute: async (_input: Record<never, never>) => {
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
			const carboniteIds = risks.map((r) => r.carboniteId);
			const cbRows = await db
				.select({
					id: carbonites.id,
					name: carbonites.name,
					sl: carbonites.sl,
					state: carbonites.state,
				})
				.from(carbonites)
				.where(inArray(carbonites.id, carboniteIds));
			const cbMap = new Map(cbRows.map((c) => [c.id, c]));
			return risks.map((risk) => ({
				...risk,
				staffName: cbMap.get(risk.carboniteId)?.name ?? null,
				staffSl: cbMap.get(risk.carboniteId)?.sl ?? null,
				staffState: cbMap.get(risk.carboniteId)?.state ?? null,
			}));
		},
	});
}

function makeGetScenarioSummary(rf: RoleFilter) {
	const entWhere = entityRoleWhere(rf);
	return tool({
		description:
			"Get scenarios with their roles for a given entity, optionally filtered by financial year.",
		inputSchema: z.object({
			entityId: z.string().describe("The entity ID to fetch scenarios for."),
			fy: z
				.string()
				.optional()
				.describe('Optional financial year filter, e.g. "FY25-26".'),
		}),
		execute: async ({ entityId, fy }) => {
			// Verify entity is within user's scope
			const [ent] = await db
				.select({ id: entities.id })
				.from(entities)
				.where(and(eq(entities.id, entityId), entWhere));
			if (!ent) return [];

			const filters = [eq(scenarios.entityId, entityId)];
			if (fy) {
				filters.push(eq(scenarios.fy, fy));
			}
			const scens = await db
				.select()
				.from(scenarios)
				.where(and(...filters))
				.orderBy(asc(scenarios.createdAt));

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
		},
	});
}

// Salary brackets and pod budgets are reference data — no role scoping needed
const getSalaryBrackets = tool({
	description:
		"Get salary brackets (min/max/mid) per service line and progression level.",
	inputSchema: z.object({
		sl: z
			.string()
			.optional()
			.describe("Optional service line abbreviation to filter by."),
	}),
	execute: async ({ sl }) => {
		if (sl) {
			return db
				.select()
				.from(salaryBrackets)
				.where(eq(salaryBrackets.sl, sl))
				.orderBy(asc(salaryBrackets.prog));
		}
		return db
			.select()
			.from(salaryBrackets)
			.orderBy(asc(salaryBrackets.sl), asc(salaryBrackets.prog));
	},
});

const getPodBudgets = tool({
	description: "Get all pod budget rows across all states and offices.",
	inputSchema: z.object({}),
	execute: async (_input: Record<never, never>) => {
		return db.select().from(podBudgets);
	},
});

const chatBodySchema = z.object({
	messages: z.array(
		z.object({
			role: z.enum(["user", "assistant", "system", "tool"]),
			content: z.union([z.string(), z.array(z.unknown())]),
		}),
	),
});

chatRoute.post("/api/chat", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) return c.json({ error: "Unauthorized" }, 401);

	// Derive role filter from authenticated user
	const userRole = session.user.role ?? "read_only";
	const isScopedRole =
		userRole === "state_manager" || userRole === "service_line_lead";
	if (isScopedRole) {
		const hasAssignment =
			(userRole === "state_manager" && session.user.assignedState) ||
			(userRole === "service_line_lead" &&
				session.user.assignedServiceLine);
		if (!hasAssignment) {
			return c.json(
				{
					error:
						"Your role requires an assigned state or service line to use chat",
				},
				403,
			);
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: SessionUser shape from Better Auth is compatible with getRoleFilter
	const rf = getRoleFilter(session.user as any);

	const raw = await c.req.json();
	const parsed = chatBodySchema.safeParse(raw);
	if (!parsed.success) {
		return c.json(
			{ error: "Invalid request body", details: parsed.error.issues },
			400,
		);
	}

	const { messages } = parsed.data;

	const result = streamText({
		model: openai("gpt-4o"),
		system: SYSTEM_PROMPT,
		// biome-ignore lint/suspicious/noExplicitAny: AI SDK CoreMessage union types are narrower than our schema
		messages: messages as any,
		tools: {
			getRevenueSummary: makeGetRevenueSummary(rf),
			getFirmKPIs: makeGetFirmKPIs(rf),
			getHiringPipeline: makeGetHiringPipeline(rf),
			getSalaryBrackets,
			getAttritionRisks: makeGetAttritionRisks(rf),
			getPodBudgets,
			getScenarioSummary: makeGetScenarioSummary(rf),
		},
		stopWhen: stepCountIs(5),
	});

	// toUIMessageStreamResponse is the v6 equivalent of toDataStreamResponse --
	// it emits the same JSON data-stream protocol (text-delta, tool-call, tool-result events)
	return result.toUIMessageStreamResponse();
});
