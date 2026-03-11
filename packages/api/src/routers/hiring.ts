import { db } from "@carbon-wfp/db";
import { carbonites } from "@carbon-wfp/db/schema/carbonites";
import { hiringNeeds } from "@carbon-wfp/db/schema/hiring-needs";
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import {
	assertResourceScope,
	assertWriter,
	getRoleFilter,
	hiringRoleWhere,
} from "../lib/rbac";

const hiringInput = z.object({
	role: z.string().min(1),
	sl: z.string().optional(),
	sg: z.string().optional(),
	state: z.string().optional(),
	office: z.string().optional(),
	location: z.string().optional(),
	positions: z.number().int().min(1).optional(),
	type: z
		.enum([
			"FT",
			"PT",
			"Contract",
			"succession",
			"growth",
			"backfill",
			"new-capability",
		])
		.optional(),
	priority: z
		.enum(["critical", "urgent", "high", "medium", "low", "planned"])
		.optional(),
	salaryMin: z.number().int().optional(),
	salaryMax: z.number().int().optional(),
	targetStart: z.string().optional(),
	approvedBy: z.string().optional(),
	managedBy: z.string().optional(),
	notes: z.string().optional(),
});

export const hiringRouter = router({
	getAll: protectedProcedure
		.input(
			z
				.object({
					status: z
						.enum(["open", "active", "offer", "closed", "all"])
						.optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const rf = getRoleFilter(ctx.session.user);
			const rbacWhere = hiringRoleWhere(rf);
			const status = input?.status ?? "open";

			const filters = [];
			if (rbacWhere) filters.push(rbacWhere);
			if (status !== "all") filters.push(eq(hiringNeeds.status, status));

			return db
				.select()
				.from(hiringNeeds)
				.where(filters.length > 0 ? and(...filters) : undefined)
				.orderBy(asc(hiringNeeds.priority), asc(hiringNeeds.targetStart));
		}),

	create: protectedProcedure
		.input(hiringInput)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			assertResourceScope(ctx.session.user, {
				state: input.state,
				sl: input.sl,
			});
			const id = `h-${crypto.randomUUID()}`;
			const [row] = await db
				.insert(hiringNeeds)
				.values({ id, ...input, status: "open" })
				.returning();
			return row;
		}),

	update: protectedProcedure
		.input(z.object({ id: z.string() }).merge(hiringInput.partial()))
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			// Fetch existing row and verify scope before mutating
			const [existing] = await db
				.select()
				.from(hiringNeeds)
				.where(eq(hiringNeeds.id, input.id));
			if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
			assertResourceScope(ctx.session.user, {
				state: existing.state,
				sl: existing.sl,
			});
			// Validate post-update scope: reject reassignment outside caller's scope
			assertResourceScope(ctx.session.user, {
				state: input.state ?? existing.state,
				sl: input.sl ?? existing.sl,
			});
			const { id, ...fields } = input;
			const [row] = await db
				.update(hiringNeeds)
				.set({ ...fields, updatedAt: new Date() })
				.where(eq(hiringNeeds.id, id))
				.returning();
			if (!row) throw new TRPCError({ code: "NOT_FOUND" });
			return row;
		}),

	close: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				closedHow: z.enum([
					"hired",
					"cancelled",
					"deferred",
					"internal",
					"referral",
				]),
				closedDate: z.string(),
				closedName: z.string().optional(),
				hiredCarboniteId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			// Verify scope before closing
			const [existing] = await db
				.select()
				.from(hiringNeeds)
				.where(eq(hiringNeeds.id, input.id));
			if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
			assertResourceScope(ctx.session.user, {
				state: existing.state,
				sl: existing.sl,
			});
			// Verify carbonite exists before linking
			if (input.hiredCarboniteId) {
				const [cb] = await db
					.select({ id: carbonites.id })
					.from(carbonites)
					.where(eq(carbonites.id, input.hiredCarboniteId));
				if (!cb)
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Carbonite not found: ${input.hiredCarboniteId}`,
					});
			}
			const { id, ...fields } = input;
			const [row] = await db
				.update(hiringNeeds)
				.set({ ...fields, status: "closed", updatedAt: new Date() })
				.where(eq(hiringNeeds.id, id))
				.returning();
			if (!row) throw new TRPCError({ code: "NOT_FOUND" });
			return row;
		}),

	reopen: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			// Verify scope before reopening
			const [existing] = await db
				.select()
				.from(hiringNeeds)
				.where(eq(hiringNeeds.id, input.id));
			if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
			assertResourceScope(ctx.session.user, {
				state: existing.state,
				sl: existing.sl,
			});
			const [row] = await db
				.update(hiringNeeds)
				.set({
					status: "open",
					closedHow: null,
					closedDate: null,
					closedName: null,
					updatedAt: new Date(),
				})
				.where(eq(hiringNeeds.id, input.id))
				.returning();
			if (!row) throw new TRPCError({ code: "NOT_FOUND" });
			return row;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			// Verify scope before deleting
			const [existing] = await db
				.select()
				.from(hiringNeeds)
				.where(eq(hiringNeeds.id, input.id));
			if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
			assertResourceScope(ctx.session.user, {
				state: existing.state,
				sl: existing.sl,
			});
			await db.delete(hiringNeeds).where(eq(hiringNeeds.id, input.id));
			return { deleted: input.id };
		}),
});
