import { db } from "@carbon-wfp/db";
import { podBudgets } from "@carbon-wfp/db/schema/pod-budgets";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

const WRITE_ROLES = ["admin", "practice_manager", "sl_lead", "state_manager"];

function assertWriter(role: string | undefined | null) {
  if (!role || !WRITE_ROLES.includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
  }
}

export const podBudgetsRouter = router({
  getAll: protectedProcedure.query(async () => {
    return await db.select().from(podBudgets);
  }),

  upsert: protectedProcedure
    .input(
      z.object({
        state: z.string(),
        office: z.string(),
        podName: z.string(),
        budget: z.number().int().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertWriter((ctx.session.user as { role?: string }).role);
      const existing = await db
        .select()
        .from(podBudgets)
        .where(
          and(
            eq(podBudgets.state, input.state),
            eq(podBudgets.office, input.office),
            eq(podBudgets.podName, input.podName),
          ),
        );

      if (existing.length > 0) {
        const [row] = await db
          .update(podBudgets)
          .set({ budget: input.budget, updatedAt: new Date() })
          .where(
            and(
              eq(podBudgets.state, input.state),
              eq(podBudgets.office, input.office),
              eq(podBudgets.podName, input.podName),
            ),
          )
          .returning();
        return row;
      }

      const [row] = await db.insert(podBudgets).values(input).returning();
      return row;
    }),
});
