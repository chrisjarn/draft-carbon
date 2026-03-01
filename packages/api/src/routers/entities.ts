import { db } from "@carbon-wfp/db";
import { entities } from "@carbon-wfp/db/schema/entities";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { ADMIN_WRITE_ROLES, assertWriter } from "../lib/rbac";

export const entitiesRouter = router({
	getAll: protectedProcedure.query(async () => {
		return await db
			.select()
			.from(entities)
			.orderBy(asc(entities.state), asc(entities.biz));
	}),

	create: protectedProcedure
		.input(
			z.object({
				biz: z.string().min(1, "Name is required"),
				state: z.string().min(1, "State is required"),
				tan: z.string().optional(),
				officeId: z.string().optional(),
				phone: z.string().optional(),
				address: z.string().optional(),
				email: z.string().optional(),
				sl: z.array(z.string()).optional(),
				partners: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user, ADMIN_WRITE_ROLES);
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
		.input(
			z.object({
				id: z.string(),
				biz: z.string().optional(),
				tan: z.string().optional(),
				officeId: z.string().optional(),
				state: z.string().optional(),
				phone: z.string().optional(),
				address: z.string().optional(),
				email: z.string().optional(),
				sl: z.array(z.string()).optional(),
				partners: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user, ADMIN_WRITE_ROLES);
			const { id, ...fields } = input;
			const [row] = await db
				.update(entities)
				.set({ ...fields, updatedAt: new Date() })
				.where(eq(entities.id, id))
				.returning();
			if (!row) throw new TRPCError({ code: "NOT_FOUND" });
			return row;
		}),
});
