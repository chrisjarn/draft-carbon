import { db } from "@carbon-wfp/db";
import { entities } from "@carbon-wfp/db/schema/entities";
import {
	OFFICE_VALUES,
	SL_VALUES,
	STATE_VALUES,
} from "@carbon-wfp/db/schema/enums";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import {
	ADMIN_WRITE_ROLES,
	assertEntityScope,
	assertWriter,
	entityRoleWhere,
	getRoleFilter,
} from "../lib/rbac";

const entityCreateInput = z.object({
	biz: z.string().min(1, "Name is required"),
	state: z.enum(STATE_VALUES, { message: "Invalid state" }),
	tan: z.string().optional(),
	officeId: z.enum(OFFICE_VALUES).optional(),
	phone: z.string().optional(),
	address: z.string().optional(),
	email: z.string().optional(),
	sl: z.array(z.enum(SL_VALUES)).optional(),
	partners: z.array(z.string()).optional(),
});

const entityUpdateInput = z.object({
	id: z.string(),
	biz: z.string().optional(),
	tan: z.string().optional(),
	officeId: z.enum(OFFICE_VALUES).optional(),
	state: z.enum(STATE_VALUES).optional(),
	phone: z.string().optional(),
	address: z.string().optional(),
	email: z.string().optional(),
	sl: z.array(z.enum(SL_VALUES)).optional(),
	partners: z.array(z.string()).optional(),
});

export const entitiesRouter = router({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const rf = getRoleFilter(ctx.session.user);
		const rbacWhere = entityRoleWhere(rf);
		return await db
			.select()
			.from(entities)
			.where(rbacWhere)
			.orderBy(asc(entities.state), asc(entities.biz));
	}),

	create: protectedProcedure
		.input(entityCreateInput)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user, ADMIN_WRITE_ROLES);
			assertEntityScope(ctx.session.user, {
				state: input.state,
				sl: input.sl,
			});
			// Generate ID from business name: "ent-" + slugified name
			const slug = input.biz
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "")
				.slice(0, 20);
			const id = `ent-${slug}`;
			// Check for duplicate ID
			const [existing] = await db
				.select({ id: entities.id })
				.from(entities)
				.where(eq(entities.id, id));
			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: `Entity with ID "${id}" already exists`,
				});
			}
			const [row] = await db
				.insert(entities)
				.values({ id, ...input })
				.returning();
			return row;
		}),

	update: protectedProcedure
		.input(entityUpdateInput)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user, ADMIN_WRITE_ROLES);
			// Fetch existing entity and verify scope before mutating
			const [existing] = await db
				.select()
				.from(entities)
				.where(eq(entities.id, input.id));
			if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
			assertEntityScope(ctx.session.user, {
				state: existing.state,
				sl: existing.sl,
			});
			// Validate post-update scope: reject reassignment outside caller's scope
			assertEntityScope(ctx.session.user, {
				state: input.state ?? existing.state,
				sl: input.sl ?? existing.sl,
			});
			const { id, ...fields } = input;
			const [row] = await db
				.update(entities)
				.set({ ...fields, updatedAt: new Date() })
				.where(eq(entities.id, id))
				.returning();
			if (!row) throw new TRPCError({ code: "NOT_FOUND" });
			return row;
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user, ADMIN_WRITE_ROLES);
			// Fetch existing entity and verify scope before deleting
			const [existing] = await db
				.select()
				.from(entities)
				.where(eq(entities.id, input.id));
			if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
			assertEntityScope(ctx.session.user, {
				state: existing.state,
				sl: existing.sl,
			});
			const [row] = await db
				.delete(entities)
				.where(eq(entities.id, input.id))
				.returning();
			if (!row) throw new TRPCError({ code: "NOT_FOUND" });
			return { deleted: input.id };
		}),
});
