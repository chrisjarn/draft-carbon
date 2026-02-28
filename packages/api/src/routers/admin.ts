import { db } from "@carbon-wfp/db";
import { user } from "@carbon-wfp/db/schema/auth";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { assertAdmin, VALID_ROLES } from "../lib/rbac";

export const adminRouter = router({
	listUsers: protectedProcedure.query(async ({ ctx }) => {
		assertAdmin(ctx.session.user);
		return await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				emailVerified: user.emailVerified,
				createdAt: user.createdAt,
			})
			.from(user)
			.orderBy(asc(user.createdAt));
	}),

	updateRole: protectedProcedure
		.input(z.object({ userId: z.string(), role: z.enum(VALID_ROLES) }))
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user);
			if (input.userId === ctx.session.user.id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot change your own role",
				});
			}
			const [row] = await db
				.update(user)
				.set({ role: input.role, updatedAt: new Date() })
				.where(eq(user.id, input.userId))
				.returning({
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
				});
			if (!row) throw new TRPCError({ code: "NOT_FOUND" });
			return row;
		}),

	deleteUser: protectedProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			assertAdmin(ctx.session.user);
			if (input.userId === ctx.session.user.id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot delete yourself",
				});
			}
			await db.delete(user).where(eq(user.id, input.userId));
			return { deleted: input.userId };
		}),
});
