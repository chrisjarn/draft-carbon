import { db } from "@carbon-wfp/db";
import { carbonites } from "@carbon-wfp/db/schema/carbonites";
import { entities } from "@carbon-wfp/db/schema/entities";
import {
	OFFICE_VALUES,
	SL_VALUES,
	STATE_VALUES,
} from "@carbon-wfp/db/schema/enums";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import {
	assertAdmin,
	assertResourceScope,
	assertWriter,
	carboniteRoleWhere,
	getRoleFilter,
} from "../lib/rbac";

const carboniteInput = z.object({
	name: z.string().min(1),
	role: z.string().optional(),
	sl: z.enum(SL_VALUES, { message: "Invalid service line" }).optional(),
	sg: z.string().optional(),
	state: z.enum(STATE_VALUES, { message: "Invalid state" }).optional(),
	office: z.enum(OFFICE_VALUES, { message: "Invalid office" }).optional(),
	pod: z.string().nullable().optional(),
	salary: z.number().int().optional(),
	type: z.enum(["FT", "PT"]).optional(),
	seniority: z.number().int().min(1).max(10).optional(),
	location: z.string().optional(),
	hours: z.number().int().optional(),
	isPartner: z.boolean().optional(),
	entity: z.string().optional(),
	reportsTo: z.string().optional(),
	startDate: z.string().optional(),
});

export const carbonitesRouter = router({
	getAll: protectedProcedure
		.input(
			z
				.object({
					search: z.string().optional(),
					state: z.enum(STATE_VALUES, { message: "Invalid state" }).optional(),
					sl: z.enum(SL_VALUES, { message: "Invalid service line" }).optional(),
					office: z
						.enum(OFFICE_VALUES, { message: "Invalid office" })
						.optional(),
					type: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const rf = getRoleFilter(ctx.session.user);
			const rbacWhere = carboniteRoleWhere(rf);
			const filters = [eq(carbonites.isActive, true)];
			if (rbacWhere) filters.push(rbacWhere);

			if (input?.search) {
				const searchFilter = or(
					ilike(carbonites.name, `%${input.search}%`),
					ilike(carbonites.role, `%${input.search}%`),
					ilike(carbonites.pod, `%${input.search}%`),
				);
				if (searchFilter) filters.push(searchFilter);
			}
			if (input?.state) filters.push(eq(carbonites.state, input.state));
			if (input?.sl) filters.push(eq(carbonites.sl, input.sl));
			if (input?.office) filters.push(eq(carbonites.office, input.office));
			if (input?.type) filters.push(eq(carbonites.type, input.type));

			return await db
				.select()
				.from(carbonites)
				.where(and(...filters))
				.orderBy(
					asc(carbonites.state),
					asc(carbonites.office),
					asc(carbonites.pod),
					asc(carbonites.name),
				);
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const rf = getRoleFilter(ctx.session.user);
			const rbacWhere = carboniteRoleWhere(rf);
			const [row] = await db
				.select()
				.from(carbonites)
				.where(and(eq(carbonites.id, input.id), rbacWhere));
			if (!row) throw new TRPCError({ code: "NOT_FOUND" });
			return row;
		}),

	create: protectedProcedure
		.input(carboniteInput)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			assertResourceScope(ctx.session.user, {
				state: input.state,
				sl: input.sl,
			});
			if (input.entity) {
				const [ent] = await db
					.select({ id: entities.id })
					.from(entities)
					.where(eq(entities.id, input.entity));
				if (!ent)
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Entity not found: ${input.entity}`,
					});
			}
			const id = `c-${crypto.randomUUID()}`;
			const [row] = await db
				.insert(carbonites)
				.values({ id, ...input })
				.returning();
			return row;
		}),

	update: protectedProcedure
		.input(z.object({ id: z.string() }).merge(carboniteInput.partial()))
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			// Fetch existing row and verify scope before mutating
			const [existing] = await db
				.select()
				.from(carbonites)
				.where(eq(carbonites.id, input.id));
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
			if (input.entity) {
				const [ent] = await db
					.select({ id: entities.id })
					.from(entities)
					.where(eq(entities.id, input.entity));
				if (!ent)
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Entity not found: ${input.entity}`,
					});
			}
			const { id, ...fields } = input;
			const [row] = await db
				.update(carbonites)
				.set({ ...fields, updatedAt: new Date() })
				.where(eq(carbonites.id, id))
				.returning();
			if (!row) throw new TRPCError({ code: "NOT_FOUND" });
			return row;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user);
			// Verify resource exists and is in scope
			const [existing] = await db
				.select()
				.from(carbonites)
				.where(eq(carbonites.id, input.id));
			if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
			assertResourceScope(ctx.session.user, {
				state: existing.state,
				sl: existing.sl,
			});
			const [row] = await db
				.update(carbonites)
				.set({ isActive: false, updatedAt: new Date() })
				.where(eq(carbonites.id, input.id))
				.returning();
			if (!row) throw new TRPCError({ code: "NOT_FOUND" });
			return { deactivated: input.id };
		}),
});
