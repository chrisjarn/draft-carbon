import { db } from "@carbon-wfp/db";
import { carbonites } from "@carbon-wfp/db/schema/carbonites";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { assertWriter } from "../lib/rbac";

const carboniteInput = z.object({
	name: z.string().min(1),
	role: z.string().optional(),
	sl: z.string().optional(),
	sg: z.string().optional(),
	state: z.string().optional(),
	office: z.string().optional(),
	pod: z.string().optional(),
	salary: z.number().int().optional(),
	type: z.enum(["FT", "PT"]).optional(),
	seniority: z.number().int().min(1).max(10).optional(),
	location: z.string().optional(),
	hours: z.number().int().optional(),
	isPartner: z.boolean().optional(),
	entity: z.string().optional(),
	reportsTo: z.string().optional(),
});

export const carbonitesRouter = router({
	getAll: protectedProcedure
		.input(
			z
				.object({
					search: z.string().optional(),
					state: z.string().optional(),
					sl: z.string().optional(),
					office: z.string().optional(),
					type: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			const filters = [];

			if (input?.search) {
				filters.push(
					or(
						ilike(carbonites.name, `%${input.search}%`),
						ilike(carbonites.role, `%${input.search}%`),
						ilike(carbonites.pod, `%${input.search}%`),
					),
				);
			}
			if (input?.state) filters.push(eq(carbonites.state, input.state));
			if (input?.sl) filters.push(eq(carbonites.sl, input.sl));
			if (input?.office) filters.push(eq(carbonites.office, input.office));
			if (input?.type) filters.push(eq(carbonites.type, input.type));

			return await db
				.select()
				.from(carbonites)
				.where(filters.length ? and(...filters) : undefined)
				.orderBy(
					asc(carbonites.state),
					asc(carbonites.office),
					asc(carbonites.pod),
					asc(carbonites.name),
				);
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ input }) => {
			const [row] = await db
				.select()
				.from(carbonites)
				.where(eq(carbonites.id, input.id));
			if (!row) throw new TRPCError({ code: "NOT_FOUND" });
			return row;
		}),

	create: protectedProcedure
		.input(carboniteInput)
		.mutation(async ({ ctx, input }) => {
			assertWriter(ctx.session.user);
			const id = `c${Date.now()}`;
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
			assertWriter(ctx.session.user);
			await db.delete(carbonites).where(eq(carbonites.id, input.id));
			return { deleted: input.id };
		}),
});
