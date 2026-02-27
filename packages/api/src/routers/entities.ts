import { db } from "@carbon-wfp/db";
import { entities } from "@carbon-wfp/db/schema/entities";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

const WRITE_ROLES = ["admin", "practice_manager"];

function assertWriter(role: string | undefined | null) {
  if (!role || !WRITE_ROLES.includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
  }
}

export const entitiesRouter = router({
  getAll: protectedProcedure.query(async () => {
    return await db
      .select()
      .from(entities)
      .orderBy(asc(entities.state), asc(entities.biz));
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
      assertWriter((ctx.session.user as { role?: string }).role);
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
